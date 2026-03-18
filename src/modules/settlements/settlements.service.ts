import { calculateMonthlySettlement } from "@/lib/calculations";
import {
  EventParticipant,
  MonthlySetting,
  Session,
  SessionAttendance,
  ShuttlecockDetail,
} from "@/lib/types";
import { createMonthsService } from "@/modules/months/months.service";
import { createSessionsService } from "@/modules/sessions/sessions.service";
import { createShuttlecocksRepository } from "@/modules/shuttlecocks/shuttlecocks.repository";
import { createEventParticipantsRepository } from "@/modules/events/event-participants.repository";
import { createEventsRepository } from "@/modules/events/events.repository";
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
    throw new ValidationError("monthId must be a positive integer");
  }
}

function normalizeQuery(filters?: SettlementListFilters) {
  const page = Math.max(1, Number(filters?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters?.limit || 20)));
  const status = filters?.status || "all";
  const sortBy = filters?.sortBy || "total_due";
  const sortOrder = filters?.sortOrder || "desc";

  if (!["all", "paid", "unpaid"].includes(status)) {
    throw new ValidationError("status must be one of: all, paid, unpaid");
  }

  if (!["total_due", "created_at", "paid_at", "user_id"].includes(sortBy)) {
    throw new ValidationError("sortBy is invalid");
  }

  if (!["asc", "desc"].includes(sortOrder)) {
    throw new ValidationError("sortOrder must be asc or desc");
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
      throw new ValidationError("Settlement ID is invalid");
    }
    const settlement = await this.repository.findById(id);
    if (!settlement) {
      throw new NotFoundError("Settlement");
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
    const month = await monthsService.getMonth(monthId);
    const existing = await this.repository.findByMonth(monthId);
    const force = options?.force || false;

    if (existing.length > 0 && !force) {
      throw new ConflictError(
        "Settlements for this month already exist. Use force=true to regenerate."
      );
    }

    const sessions = await sessionsService.listSessionsByMonth(monthId);
    if (sessions.length === 0) {
      throw new InvalidStateError(
        "Cannot generate settlements for a month with no sessions"
      );
    }

    const attendances = await this.getAttendanceForSessions(
      sessions,
      sessionsService
    );

    const participants = this.getParticipantIds(attendances);
    if (participants.length === 0) {
      throw new InvalidStateError(
        "Cannot generate settlements: no attended records found"
      );
    }

    const shuttlecockDetails = await this.getShuttlecockDetails(monthId);
    const eventParticipants = await this.getEventParticipantsForMonth(monthId);

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
      throw new ConflictError("Settlement is already marked as paid");
    }

    const amount = paidAmount ?? settlement.total_due;
    if (amount < 0) {
      throw new ValidationError("paidAmount must be >= 0");
    }

    const normalizedAmount = Math.round(amount * 100) / 100;
    const expectedAmount = Math.round(settlement.total_due * 100) / 100;
    if (normalizedAmount !== expectedAmount) {
      throw new ValidationError("paidAmount must be equal to settlement total_due");
    }

    const updatedSettlement = await this.repository.markPaid(
      settlementId,
      normalizedAmount
    );

    return updatedSettlement;
  }

  private async getAttendanceForSessions(
    sessions: Session[],
    sessionsService: { getSessionAttendance: (sessionId: number) => Promise<SessionAttendance[]> }
  ): Promise<SessionAttendance[]> {
    const chunks = await Promise.all(
      sessions.map((session) => sessionsService.getSessionAttendance(session.id))
    );
    return chunks.flat();
  }

  private getParticipantIds(attendances: SessionAttendance[]): string[] {
    const ids = new Set<string>();
    for (const row of attendances) {
      if (row.is_attended) {
        ids.add(row.user_id);
      }
    }
    return Array.from(ids);
  }

  /**
   * Fetch actual shuttlecock detail records for a month
   */
  private async getShuttlecockDetails(monthId: number): Promise<ShuttlecockDetail[]> {
    try {
      const repo = await createShuttlecocksRepository();
      return await repo.findByMonth(monthId);
    } catch {
      return [];
    }
  }

  /**
   * Fetch event participants for events linked to this month
   */
  private async getEventParticipantsForMonth(monthId: number): Promise<EventParticipant[]> {
    try {
      const eventsRepo = await createEventsRepository();
      const participantsRepo = await createEventParticipantsRepository();

      // Find events linked to this month
      const { data: events } = await (eventsRepo as any).supabase
        .from("events")
        .select("id")
        .eq("month_id", monthId);

      if (!events || events.length === 0) {
        return [];
      }

      const allParticipants: EventParticipant[] = [];
      for (const event of events) {
        const participants = await participantsRepo.findByEvent(event.id);
        allParticipants.push(...participants);
      }

      return allParticipants;
    } catch {
      return [];
    }
  }
}

export async function createSettlementsService() {
  const repository = await createSettlementsRepository();
  return new SettlementsService(repository);
}
