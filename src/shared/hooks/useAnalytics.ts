/**
 * Analytics Hook
 * Fetches analytics data by type
 */

import { useFetch } from './useFetch';
import type {
  OverviewStats,
  AttendanceRankItem,
  ExpenseTrendItem,
} from '@/modules/analytics/types';

export function useOverviewStats() {
  return useFetch<{ type: string; data: OverviewStats }>(
    '/api/analytics?type=overview'
  );
}

export function useAttendanceRanking() {
  return useFetch<{ type: string; data: AttendanceRankItem[] }>(
    '/api/analytics?type=attendance'
  );
}

export function useExpenseTrend() {
  return useFetch<{ type: string; data: ExpenseTrendItem[] }>(
    '/api/analytics?type=expense'
  );
}
