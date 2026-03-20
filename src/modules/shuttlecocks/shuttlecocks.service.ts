import { ShuttlecockDetail } from "@/lib/types";
import { createShuttlecocksRepository, ShuttlecocksRepository } from "./shuttlecocks.repository";
import { createMonthsService } from "@/modules/months/months.service";
import { ValidationError, NotFoundError } from "@/shared/api";

export class ShuttlecocksService {
  constructor(private repository: ShuttlecocksRepository) {}

  private validateId(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError("ID chi tiết cầu không hợp lệ");
    }
  }

  private validatePurchaseDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ValidationError("purchase_date phải có định dạng YYYY-MM-DD");
    }
  }

  private validateQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError("quantity phải là số nguyên dương");
    }
  }

  private validateUnitPrice(unitPrice: number) {
    if (unitPrice <= 0) {
      throw new ValidationError("unit_price phải lớn hơn 0");
    }
  }

  private validateBuyerUserId(buyerUserId: string) {
    if (!buyerUserId?.trim()) {
      throw new ValidationError("Thiếu buyer_user_id");
    }
  }

  async listByMonth(monthId: number) {
    if (!Number.isInteger(monthId) || monthId <= 0) throw new ValidationError("ID tháng không hợp lệ");
    return this.repository.findByMonthWithBuyer(monthId);
  }

  async getById(id: number) {
    this.validateId(id);

    try {
      const detail = await this.repository.findById(id);
      if (!detail) {
        throw new NotFoundError("chi tiết mua cầu");
      }
      return detail;
    } catch {
      throw new NotFoundError("chi tiết mua cầu");
    }
  }

  async createDetail(data: {
    month_id: number;
    purchase_date: string;
    quantity: number;
    unit_price: number;
    buyer_user_id: string;
    notes?: string;
  }) {
    if (!Number.isInteger(data.month_id) || data.month_id <= 0) {
      throw new ValidationError("ID tháng không hợp lệ");
    }
    this.validatePurchaseDate(data.purchase_date);
    this.validateQuantity(data.quantity);
    this.validateUnitPrice(data.unit_price);
    this.validateBuyerUserId(data.buyer_user_id);

    return this.repository.createDetail(data);
  }

  async updateDetail(
    id: number,
    data: Partial<{
      purchase_date: string;
      quantity: number;
      unit_price: number;
      buyer_user_id: string;
      notes: string;
    }>
  ) {
    this.validateId(id);

    try {
      await this.repository.findById(id);
    } catch {
      throw new NotFoundError("chi tiết mua cầu");
    }

    if (data.purchase_date !== undefined) {
      this.validatePurchaseDate(data.purchase_date);
    }
    if (data.quantity !== undefined) {
      this.validateQuantity(data.quantity);
    }
    if (data.unit_price !== undefined) {
      this.validateUnitPrice(data.unit_price);
    }
    if (data.buyer_user_id !== undefined) {
      this.validateBuyerUserId(data.buyer_user_id);
    }

    return this.repository.updateDetail(id, data);
  }

  async deleteDetail(id: number) {
    this.validateId(id);

    try {
      await this.repository.findById(id);
    } catch {
      throw new NotFoundError("chi tiết mua cầu");
    }

    return this.repository.deleteDetail(id);
  }

  async addPurchase(data: {
    month_id: number;
    purchase_date: string;
    quantity: number;
    unit_price: number;
    buyer_user_id: string;
    notes?: string;
  }) {
    const detail = await this.repository.createDetail(data);
    await this.syncMonthTotal(data.month_id);
    return detail;
  }

  async updatePurchase(
    id: number,
    data: Partial<{
      purchase_date: string;
      quantity: number;
      unit_price: number;
      buyer_user_id: string;
      notes: string;
    }>
  ) {
    const detail = await this.repository.updateDetail(id, data);
    if (detail) {
      await this.syncMonthTotal(detail.month_id);
    }
    return detail;
  }

  async deletePurchase(id: number) {
    const detail = await this.repository.findById(id);
    if (!detail) throw new NotFoundError("chi tiết mua cầu");
    
    // Delete will verify success automatically
    await this.repository.deleteDetail(id);
    
    // Sync month total after successful deletion
    await this.syncMonthTotal(detail.month_id);
    return true;
  }

  private async syncMonthTotal(monthId: number) {
    const details = await this.repository.findByMonth(monthId);
    const total = details.reduce((sum, d) => sum + Number(d.quantity) * Number(d.unit_price), 0);
    
    const monthsService = await createMonthsService();
    await monthsService.updateShuttlecockExpense(monthId, total);
  }
}

export async function createShuttlecocksService() {
  const repository = await createShuttlecocksRepository();
  return new ShuttlecocksService(repository);
}
