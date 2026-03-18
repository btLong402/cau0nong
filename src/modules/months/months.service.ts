/**
 * Months Service
 * Business logic for billing cycle management
 */

import { Month } from "@/lib/types";
import { MonthsRepository, createMonthsRepository } from "./months.repository";
import { NotFoundError, ConflictError } from "@/shared/api";

export interface CreateMonthData {
  month_year: string; // YYYY-MM-01 format
  status?: "open" | "closed";
}

/**
 * Months Service
 */
export class MonthsService {
  constructor(private repository: MonthsRepository) {}

  /**
   * Create new billing month
   */
  async createMonth(data: CreateMonthData): Promise<Month> {
    // Validate format
    if (!/^\d{4}-\d{2}-01$/.test(data.month_year)) {
      throw new Error("month_year must be in format YYYY-MM-01");
    }

    // Check if month already exists
    const existing = await this.repository.findByMonthYear(data.month_year);
    if (existing) {
      throw new ConflictError(`Month ${data.month_year} already exists`);
    }

    return await this.repository.create({
      month_year: data.month_year,
      status: data.status || "open",
      total_shuttlecock_expense: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
  }

  /**
   * Get month by ID
   */
  async getMonth(monthId: number): Promise<Month> {
    const month = await this.repository.findById(monthId);

    if (!month) {
      throw new NotFoundError("Month");
    }

    return month;
  }

  /**
   * Get all months (sorted by date descending)
   */
  async listMonths(filters?: {
    status?: "open" | "closed";
  }): Promise<Month[]> {
    if (filters?.status) {
      return await this.repository.findByStatus(filters.status);
    }

    return await this.repository.findAllSorted();
  }

  /**
   * Get all open months
   */
  async listOpenMonths(): Promise<Month[]> {
    return await this.repository.findAllOpen();
  }

  /**
   * Close billing month
   * Typically triggers settlement calculation in Phase 2
   */
  async closeMonth(monthId: number): Promise<Month> {
    const month = await this.getMonth(monthId);

    if (month.status === "closed") {
      throw new Error("Month is already closed");
    }

    return await this.repository.updateStatus(monthId, "closed");
  }

  /**
   * Reopen month (admin only)
   */
  async reopenMonth(monthId: number): Promise<Month> {
    const month = await this.getMonth(monthId);

    if (month.status === "open") {
      throw new Error("Month is already open");
    }

    return await this.repository.updateStatus(monthId, "open");
  }

  /**
   * Get current/latest open month
   */
  async getCurrentMonth(): Promise<Month | null> {
    const openMonths = await this.repository.findAllOpen();

    if (openMonths.length === 0) {
      return null;
    }

    // Return most recent open month
    return openMonths.sort(
      (a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime()
    )[0];
  }

  /**
   * Update total shuttlecock expense
   * Called during Phase 2 settlement calculation
   */
  async updateShuttlecockExpense(monthId: number, amount: number): Promise<Month> {
    await this.getMonth(monthId); // Verify exists

    return await this.repository.updateShuttlecockExpense(monthId, amount);
  }
}

/**
 * Create months service with injected repository
 */
export async function createMonthsService() {
  const repository = await createMonthsRepository();
  return new MonthsService(repository);
}
