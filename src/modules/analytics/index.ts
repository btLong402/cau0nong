/**
 * Analytics Module — Barrel Exports
 */

export { AnalyticsService, createAnalyticsService } from "./analytics.service";
export { AnalyticsRepository, createAnalyticsRepository } from "./analytics.repository";
export type {
  AttendanceRankItem,
  ExpenseTrendItem,
  OverviewStats,
  AnalyticsType,
} from "./types";
