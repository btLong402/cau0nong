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
            <div className="skeleton h-4 w-20" />
            <div
              className="skeleton h-6"
              style={{ width: `${60 - i * 8}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[var(--muted)]">
        Chưa có dữ liệu điểm danh.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.sessions_attended));

  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((item, index) => (
        <div key={item.user_id} className="flex items-center gap-3">
          <span className="w-5 text-right text-xs font-medium text-[var(--muted)]">
            {index + 1}
          </span>
          <span className="w-24 truncate text-sm font-medium text-[var(--foreground)]">
            {item.user_name}
          </span>
          <div className="flex-1">
            <div
              className="h-6 rounded-md bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500"
              style={{
                width: `${maxCount > 0 ? (item.sessions_attended / maxCount) * 100 : 0}%`,
                minWidth: '20px',
              }}
            />
          </div>
          <span className="w-8 text-right text-sm font-semibold text-[var(--foreground)]">
            {item.sessions_attended}
          </span>
        </div>
      ))}
    </div>
  );
}
