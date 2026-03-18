'use client';

import type { ExpenseTrendItem } from '../types';

interface ExpenseTrendChartProps {
  data: ExpenseTrendItem[] | null;
  loading: boolean;
}

function formatMonthLabel(monthYear: string): string {
  const date = new Date(monthYear);
  return date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
}

export function ExpenseTrendChart({ data, loading }: ExpenseTrendChartProps) {
  if (loading) {
    return (
      <div className="flex items-end gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full skeleton rounded-t"
              style={{ height: `${40 + Math.random() * 80}px` }}
            />
            <div className="skeleton h-3 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[var(--muted)]">
        Chưa có dữ liệu chi phí theo tháng.
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total));
  const chartHeight = 180;

  return (
    <div>
      {/* Legend */}
      <div className="mb-4 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[var(--primary)]" />
          <span className="text-[var(--muted)]">Tiền sân</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[var(--warning)]" />
          <span className="text-[var(--muted)]">Tiền cầu</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1.5" style={{ height: chartHeight }}>
        {data.map((item) => {
          const courtH =
            maxTotal > 0
              ? (item.court_expense / maxTotal) * chartHeight
              : 0;
          const shuttleH =
            maxTotal > 0
              ? (item.shuttlecock_expense / maxTotal) * chartHeight
              : 0;

          return (
            <div
              key={item.month_year}
              className="group flex flex-1 flex-col items-center"
            >
              {/* Tooltip on hover */}
              <div className="pointer-events-none mb-1 hidden rounded-lg bg-[var(--foreground)] px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                <p>{item.total.toLocaleString('vi-VN')}đ</p>
              </div>

              {/* Stacked bars */}
              <div className="flex w-full flex-col items-center">
                <div
                  className="w-full max-w-[32px] rounded-t bg-[var(--warning)] transition-all duration-300"
                  style={{ height: `${shuttleH}px` }}
                />
                <div
                  className="w-full max-w-[32px] bg-[var(--primary)] transition-all duration-300"
                  style={{ height: `${courtH}px` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex gap-1.5">
        {data.map((item) => (
          <div
            key={item.month_year}
            className="flex-1 text-center text-[10px] text-[var(--muted)]"
          >
            {formatMonthLabel(item.month_year)}
          </div>
        ))}
      </div>
    </div>
  );
}
