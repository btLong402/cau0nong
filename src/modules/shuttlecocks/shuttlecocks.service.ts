/**
 * Shuttlecocks Service
 * Business logic for shuttlecock purchase management
 */

import { ShuttlecockDetail } from "@/lib/types";
import { NotFoundError, ValidationError } from "@/shared/api";
import {
  ShuttlecocksRepository,
  createShuttlecocksRepository,
} from "./shuttlecocks.repository";

export interface CreateShuttlecockData {
  month_id: number;
  purchase_date: string; // YYYY-MM-DD
  quantity: number;
  unit_price: number;
  buyer_user_id: string;
  notes?: string;
}

export interface UpdateShuttlecockData {
  purchase_date?: string;
  quantity?: number;
  unit_price?: number;
  buyer_user_id?: string;
  notes?: string;
}

export class ShuttlecocksService {
  constructor(private repository: ShuttlecocksRepository) {}

  /**
   * List all shuttlecock details for a month
   */
  async listByMonth(monthId: number) {
    if (!Number.isInteger(monthId) || monthId <= 0) {
      throw new ValidationError("monthId must be a positive integer");
    }
    return this.repository.findByMonthWithBuyer(monthId);
  }

  /**
   * Get a single shuttlecock detail by ID
   */
  async getById(id: number): Promise<ShuttlecockDetail> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError("Shuttlecock detail ID is invalid");
    }
    try {
      return await this.repository.findById(id);
    } catch {
      throw new NotFoundError("Shuttlecock detail");
    }
  }

  /**
   * Create a new shuttlecock purchase record
   * DB trigger will auto-update months.total_shuttlecock_expense
   */
  async createDetail(data: CreateShuttlecockData): Promise<ShuttlecockDetail> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.purchase_date)) {
      throw new ValidationError("purchase_date must be in format YYYY-MM-DD");
    }
    if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
      throw new ValidationError("quantity must be a positive integer");
    }
    if (data.unit_price <= 0) {
      throw new ValidationError("unit_price must be greater than 0");
    }
    if (!data.buyer_user_id) {
      throw new ValidationError("buyer_user_id is required");
    }

    return this.repository.createDetail({
      month_id: data.month_id,
      purchase_date: data.purchase_date,
      quantity: data.quantity,
      unit_price: data.unit_price,
      buyer_user_id: data.buyer_user_id,
      notes: data.notes,
    });
  }

  /**
   * Update an existing shuttlecock purchase record
   * DB trigger will auto-update months.total_shuttlecock_expense
   */
  async updateDetail(
    id: number,
    data: UpdateShuttlecockData
  ): Promise<ShuttlecockDetail> {
    await this.getById(id); // verify exists

    if (data.purchase_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.purchase_date)) {
      throw new ValidationError("purchase_date must be in format YYYY-MM-DD");
    }
    if (data.quantity !== undefined && (!Number.isInteger(data.quantity) || data.quantity <= 0)) {
      throw new ValidationError("quantity must be a positive integer");
    }
    if (data.unit_price !== undefined && data.unit_price <= 0) {
      throw new ValidationError("unit_price must be greater than 0");
    }

    return this.repository.updateDetail(id, data);
  }

  /**
   * Delete a shuttlecock purchase record
   * DB trigger will auto-update months.total_shuttlecock_expense
   */
  async deleteDetail(id: number): Promise<boolean> {
    await this.getById(id); // verify exists
    return this.repository.deleteDetail(id);
  }
}

export async function createShuttlecocksService(): Promise<ShuttlecocksService> {
  const repository = await createShuttlecocksRepository();
  return new ShuttlecocksService(repository);
}
