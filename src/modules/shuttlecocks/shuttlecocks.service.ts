import { ShuttlecockDetail } from "@/lib/types";
import { createShuttlecocksRepository, ShuttlecocksRepository } from "./shuttlecocks.repository";
import { createMonthsService } from "@/modules/months/months.service";
import { ValidationError, NotFoundError } from "@/shared/api";

export class ShuttlecocksService {
  constructor(private repository: ShuttlecocksRepository) {}

  async listByMonth(monthId: number) {
    if (!monthId || monthId <= 0) throw new ValidationError("Invalid month ID");
    return this.repository.findByMonthWithBuyer(monthId);
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
    if (!detail) throw new NotFoundError("Shuttlecock detail");
    
    await this.repository.deleteDetail(id);
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
