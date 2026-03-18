/**
 * AttendanceRankingChart Component
 * Horizontal bar chart showing attendance ranking
 * Uses pure CSS bars (no external chart library needed initially)
 */

'use client';

import type { AttendanceRankItem } from '../types';

interface AttendanceRankingChartProps {
  data: AttendanceRankItem[] | null;
  loading: boolean;
}

export function AttendanceRankingChart({
  data,
  loading,
}: AttendanceRankingChartProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            <div
              className="h-6 animate-pulse rounded bg-slate-200"
              style={{ width: `${60 - i * 8}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Chua co du lieu diem danh.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.sessions_attended));

  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((item, index) => (
        <div key={item.user_id} className="flex items-center gap-3">
          <span className="w-5 text-right text-xs font-medium text-slate-400">
            {index + 1}
          </span>
          <span className="w-24 truncate text-sm font-medium text-slate-800">
            {item.user_name}
          </span>
          <div className="flex-1">
            <div
              className="h-6 rounded-md bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
              style={{
                width: `${maxCount > 0 ? (item.sessions_attended / maxCount) * 100 : 0}%`,
                minWidth: '20px',
              }}
            />
          </div>
          <span className="w-8 text-right text-sm font-semibold text-slate-700">
            {item.sessions_attended}
          </span>
        </div>
      ))}
    </div>
  );
}
