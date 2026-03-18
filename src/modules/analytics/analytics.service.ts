/**
 * Analytics Service
 * Business logic wrapper for analytics data
 */

import {
  AnalyticsRepository,
  createAnalyticsRepository,
} from "./analytics.repository";
import type {
  AnalyticsType,
  AttendanceRankItem,
  ExpenseTrendItem,
  OverviewStats,
} from "./types";
import { ValidationError } from "@/shared/api";

const VALID_TYPES: AnalyticsType[] = ["overview", "attendance", "expense"];

export class AnalyticsService {
  constructor(private repository: AnalyticsRepository) {}

  async getAnalytics(
    type: AnalyticsType
  ): Promise<OverviewStats | AttendanceRankItem[] | ExpenseTrendItem[]> {
    if (!VALID_TYPES.includes(type)) {
      throw new ValidationError(
        `type must be one of: ${VALID_TYPES.join(", ")}`
      );
    }

    switch (type) {
      case "overview":
        return this.repository.getOverviewStats();
      case "attendance":
        return this.repository.getAttendanceRanking();
      case "expense":
        return this.repository.getExpenseTrend();
    }
  }
}

export async function createAnalyticsService(): Promise<AnalyticsService> {
  const repository = await createAnalyticsRepository();
  return new AnalyticsService(repository);
}
