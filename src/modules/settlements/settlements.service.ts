import { calculateMonthlySettlement, calculateCarriedBalance } from "@/lib/calculations";
import {
  MonthlySetting,
} from "@/lib/types";
import { createMonthsService } from "@/modules/months/months.service";
import { createSessionsService } from "@/modules/sessions/sessions.service";
import { createUsersService } from "@/modules/users/users.service";
import {
  getAttendanceForSessions,
  getEventParticipantsForMonth,
  getParticipantIds,
  getShuttlecockDetails,
} from "./settlements.helpers";
import {
  ConflictError,
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from "@/shared/api";
import {
  createSettlementsRepository,
  SettlementListItem,
  SettlementPaymentStatusFilter,
  SettlementSortBy,
  SettlementSortOrder,
  SettlementsRepository,
} from "./settlements.repository";

export interface GenerateSettlementResult {
  monthId: number;
  generatedCount: number;
  totalDue: number;
  totalPaidCount: number;
}

export interface SettlementListFilters {
  page?: number;
  limit?: number;
  status?: SettlementPaymentStatusFilter;
  search?: string;
  sortBy?: SettlementSortBy;
  sortOrder?: SettlementSortOrder;
}

export interface SettlementListResult {
  items: SettlementListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

function validateMonthId(monthId: number) {
  if (!Number.isInteger(monthId) || monthId <= 0) {
    throw new ValidationError("monthId phải là số nguyên dương");
  }
}

function normalizeQuery(filters?: SettlementListFilters) {
  const page = Math.max(1, Number(filters?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters?.limit || 20)));
  const status = filters?.status || "all";
  const sortBy = filters?.sortBy || "total_due";
  const sortOrder = filters?.sortOrder || "desc";

  if (!["all", "paid", "unpaid"].includes(status)) {
    throw new ValidationError("status phải là một trong: all, paid, unpaid");
  }

  if (!["total_due", "created_at", "paid_at", "user_id"].includes(sortBy)) {
    throw new ValidationError("sortBy không hợp lệ");
  }

  if (!["asc", "desc"].includes(sortOrder)) {
    throw new ValidationError("sortOrder phải là asc hoặc desc");
  }

  return {
    page,
    limit,
    status: status as SettlementPaymentStatusFilter,
    sortBy: sortBy as SettlementSortBy,
    sortOrder: sortOrder as SettlementSortOrder,
    search: filters?.search?.trim() || undefined,
  };
}

export class SettlementsService {
  constructor(private repository: SettlementsRepository) {}

  async listByMonth(monthId: number): Promise<MonthlySetting[]> {
    validateMonthId(monthId);
    return this.repository.findByMonth(monthId);
  }

  async listByMonthPaginated(
    monthId: number,
    filters?: SettlementListFilters
  ): Promise<SettlementListResult> {
    validateMonthId(monthId);
    const query = normalizeQuery(filters);
    const result = await this.repository.findByMonthPaginated({
      monthId,
      page: query.page,
      limit: query.limit,
      status: query.status,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const totalPages = Math.max(1, Math.ceil(result.total / query.limit));

    return {
      items: result.items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages,
        hasMore: query.page < totalPages,
      },
    };
  }

  async getById(id: number): Promise<MonthlySetting> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError("ID quyết toán không hợp lệ");
    }
    const settlement = await this.repository.findById(id);
    if (!settlement) {
      throw new NotFoundError("khoản quyết toán");
    }
    return settlement;
  }

  async generateForMonth(
    monthId: number,
    options?: { force?: boolean }
  ): Promise<GenerateSettlementResult> {
    validateMonthId(monthId);

    const monthsService = await createMonthsService();
    const sessionsService = await createSessionsService();
    await monthsService.getMonth(monthId);
    const existing = await this.repository.findByMonth(monthId);
    const force = options?.force || false;

    if (existing.length > 0 && !force) {
      throw new ConflictError(
        "Quyết toán của tháng này đã tồn tại. Dùng force=true để tạo lại."
      );
    }

    const sessions = await sessionsService.listSessionsByMonth(monthId);
    if (sessions.length === 0) {
      throw new InvalidStateError(
        "Không thể tạo quyết toán cho tháng không có buổi tập"
      );
    }

    const attendances = await getAttendanceForSessions(
      sessions,
      sessionsService
    );

    const participants = getParticipantIds(attendances);
    if (participants.length === 0) {
      throw new InvalidStateError(
        "Không thể tạo quyết toán: không có dữ liệu điểm danh đã tham gia"
      );
    }

    const shuttlecockDetails = await getShuttlecockDetails(monthId);
    const eventParticipants = await getEventParticipantsForMonth(monthId);

    const rows: Array<Omit<MonthlySetting, "id" | "created_at">> = [];
    for (const userId of participants) {
      const previousSettlement = await this.repository.findPreviousByUser(
        monthId,
        userId
      );

      rows.push(
        calculateMonthlySettlement({
          userId,
          monthId,
          sessions,
          attendances,
          shuttlecockExpense: shuttlecockDetails,
          previousSettlement: previousSettlement || undefined,
          eventParticipants,
        })
      );
    }

    const saved = await this.repository.upsertByMonthAndUser(rows);
    
    // Sync users' real balances with the carry-forward amount of this month
    const usersService = await createUsersService();
    for (const record of saved) {
      // The "balance" for a user is effectively the credit carried forward from the MOST RECENT month.
      // After generating this month's settlements (if it's the current month), 
      // we can update their balance.
      const carriedToNext = calculateCarriedBalance(record);
      await usersService.updateBalance(record.user_id, carriedToNext);
    }

    const totalDue = saved.reduce((sum, s) => sum + s.total_due, 0);

    return {
      monthId,
      generatedCount: saved.length,
      totalDue: Math.round(totalDue * 100) / 100,
      totalPaidCount: saved.filter((s) => s.is_paid).length,
    };
  }

  async markPaid(settlementId: number, paidAmount?: number): Promise<MonthlySetting> {
    const settlement = await this.getById(settlementId);

    if (settlement.is_paid) {
      throw new ConflictError("Khoản quyết toán đã được đánh dấu đã thanh toán");
    }

    const amount = paidAmount ?? settlement.total_due;
    if (amount < 0) {
      throw new ValidationError("paidAmount phải lớn hơn hoặc bằng 0");
    }

    const normalizedAmount = Math.round(amount * 100) / 100;
    const expectedAmount = Math.round(settlement.total_due * 100) / 100;
    if (normalizedAmount !== expectedAmount) {
      throw new ValidationError("paidAmount phải bằng total_due của khoản quyết toán");
    }

    const updatedSettlement = await this.repository.markPaid(
      settlementId,
      normalizedAmount
    );

    return updatedSettlement;
  }
}

export async function createSettlementsService() {
  const repository = await createSettlementsRepository();
  return new SettlementsService(repository);
}
