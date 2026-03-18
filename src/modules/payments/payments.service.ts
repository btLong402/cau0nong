import { createMonthsService } from "@/modules/months/months.service";
import { createSettlementsService } from "@/modules/settlements/settlements.service";
import { InvalidStateError, ValidationError, ApiError, ErrorCode } from "@/shared/api";
import { createPaymentsRepository, PaymentsRepository } from "./payments.repository";
import {
  GeneratedVietQR,
  PaymentListFilters,
  PaymentListResult,
  VietQRPayload,
} from "./payments.types";

const DEFAULT_BANK_BIN = "970436";
const DEFAULT_ACCOUNT_NO = "0000000000";
const DEFAULT_ACCOUNT_NAME = "CLB CAU LONG";
const DEFAULT_TEMPLATE = "compact2";

function normalizeAmount(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

function normalizeQuery(filters?: PaymentListFilters) {
  const page = Math.max(1, Number(filters?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters?.limit || 20)));
  const status = filters?.status || "all";

  if (!["all", "paid", "unpaid"].includes(status)) {
    throw new ValidationError("status must be one of: all, paid, unpaid");
  }

  return {
    page,
    limit,
    status: status as "all" | "paid" | "unpaid",
    search: filters?.search?.trim() || undefined,
  };
}

function buildTransferDescription(monthYear: string, userId: string): string {
  const monthText = monthYear.slice(0, 7); // YYYY-MM
  const shortUser = userId.slice(0, 8).toUpperCase();
  return `CLB CAU LONG ${monthText} ${shortUser}`;
}

function buildVietQRContent(payload: VietQRPayload): string {
  const params = new URLSearchParams({
    bankBin: payload.bankBin,
    accountNo: payload.accountNo,
    amount: String(payload.amount),
    addInfo: payload.addInfo,
    accountName: payload.accountName,
    template: payload.template,
  });

  return `vietqr://pay?${params.toString()}`;
}

export class PaymentsService {
  constructor(private repository: PaymentsRepository) {}

  async createOrReuseSettlementVietQR(settlementId: number): Promise<GeneratedVietQR> {
    if (!Number.isInteger(settlementId) || settlementId <= 0) {
      throw new ValidationError("settlementId must be a positive integer");
    }

    const settlementsService = await createSettlementsService();
    const monthsService = await createMonthsService();

    const settlement = await settlementsService.getById(settlementId);
    if (settlement.is_paid) {
      throw new InvalidStateError("Cannot generate VietQR for a paid settlement");
    }

    const month = await monthsService.getMonth(settlement.month_id);
    const amount = normalizeAmount(settlement.total_due);

    const payload: VietQRPayload = {
      bankBin: process.env.VIETQR_BANK_BIN || DEFAULT_BANK_BIN,
      accountNo: process.env.VIETQR_ACCOUNT_NO || DEFAULT_ACCOUNT_NO,
      accountName: process.env.VIETQR_ACCOUNT_NAME || DEFAULT_ACCOUNT_NAME,
      amount,
      addInfo: buildTransferDescription(month.month_year, settlement.user_id),
      template: process.env.VIETQR_TEMPLATE || DEFAULT_TEMPLATE,
    };

    const existing = await this.repository.findLatestBySettlement(settlementId);
    const nextContent = buildVietQRContent(payload);

    if (existing && existing.qr_content === nextContent) {
      return {
        payment: existing,
        payload,
      };
    }

    try {
      const payment = await this.repository.createVietQRPayment({
        settlement_id: settlement.id,
        user_id: settlement.user_id,
        qr_content: nextContent,
        qr_image_url: undefined,
        paid_at: undefined,
      });

      return {
        payment,
        payload,
      };
    } catch (error: any) {
      if (error instanceof ApiError && error.code === ErrorCode.ERR_FORBIDDEN) {
        return {
          payment: {
            id: 0,
            settlement_id: settlement.id,
            user_id: settlement.user_id,
            qr_content: nextContent,
            qr_image_url: undefined,
            paid_at: undefined,
            created_at: new Date().toISOString(),
          },
          payload,
        };
      }
      throw error;
    }
  }

  async listByMonth(monthId: number, filters?: PaymentListFilters): Promise<PaymentListResult> {
    if (!Number.isInteger(monthId) || monthId <= 0) {
      throw new ValidationError("monthId must be a positive integer");
    }

    const query = normalizeQuery(filters);
    const result = await this.repository.listByMonth(
      monthId,
      query.page,
      query.limit,
      query.search,
      query.status
    );

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
}

export async function createPaymentsService() {
  const repository = await createPaymentsRepository();
  return new PaymentsService(repository);
}
