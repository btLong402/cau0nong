'use client';

import { useState } from 'react';
import { Month } from '@/shared/hooks';
import { CustomSelect } from '@/shared/components/CustomSelect';

interface SettlementsFiltersProps {
  months: Month[];
  activeMonthId: number | null;
  paymentFilter: 'all' | 'paid' | 'unpaid';
  searchUser: string;
  sortBy: 'total_due' | 'created_at' | 'paid_at' | 'user_id';
  sortOrder: 'asc' | 'desc';
  limit: number;
  onMonthChange: (value: number) => void;
  onPaymentFilterChange: (value: 'all' | 'paid' | 'unpaid') => void;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: 'total_due' | 'created_at' | 'paid_at' | 'user_id') => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onLimitChange: (value: number) => void;
  onResetPage: () => void;
  formatMonthLabel: (value: string) => string;
}

export function SettlementsFilters({
  months,
  activeMonthId,
  paymentFilter,
  searchUser,
  sortBy,
  sortOrder,
  limit,
  onMonthChange,
  onPaymentFilterChange,
  onSearchChange,
  onSortByChange,
  onSortOrderChange,
  onLimitChange,
  onResetPage,
  formatMonthLabel,
}: SettlementsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="surface-card p-4 md:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CustomSelect
          label="Chọn kỳ quản lý"
          value={activeMonthId}
          onChange={(val) => {
            onMonthChange(val);
            onResetPage();
          }}
          options={months.map((m) => ({
            value: m.id,
            label: formatMonthLabel(m.month_year),
            sublabel: m.status === 'open' ? 'Đang mở' : 'Đã đóng',
          }))}
        />

        <div className="md:col-span-2">
          <label htmlFor="searchUser" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Tìm theo tên, email hoặc User ID
          </label>
          <div className="flex gap-2">
            <input
              id="searchUser"
              value={searchUser}
              onChange={(event) => {
                onSearchChange(event.target.value);
                onResetPage();
              }}
              placeholder="Ví dụ: long hoặc @caulongclb.local"
              className="input-field"
            />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`btn-secondary min-w-[44px] px-2 md:hidden ${isExpanded ? 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-muted)]' : ''}`}
              title="Bộ lọc nâng cao"
            >
              <svg 
                className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3 6h.008v.008H3V6zm0 6h.008v.008H3V12zm0 6h.008v.008H3v-.008z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`collapsible-container mt-4 md:!grid-template-rows-1 ${isExpanded ? 'is-expanded' : ''}`}>
        <div className="collapsible-content">
          <div className="grid grid-cols-1 gap-4 pt-1 md:grid-cols-4 md:pt-0">
            <CustomSelect
              label="Lọc thanh toán"
              value={paymentFilter}
              onChange={(val) => {
                onPaymentFilterChange(val);
                onResetPage();
              }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'paid', label: 'Đã thanh toán' },
                { value: 'unpaid', label: 'Chưa thanh toán' },
              ]}
            />

            <CustomSelect
              label="Sắp xếp theo"
              value={sortBy}
              onChange={(val) => {
                onSortByChange(val);
                onResetPage();
              }}
              options={[
                { value: 'total_due', label: 'Tổng cần thu' },
                { value: 'created_at', label: 'Ngày tạo quyết toán' },
                { value: 'paid_at', label: 'Ngày thanh toán' },
                { value: 'user_id', label: 'User ID' },
              ]}
            />

            <CustomSelect
              label="Thứ tự"
              value={sortOrder}
              onChange={(val) => {
                onSortOrderChange(val);
                onResetPage();
              }}
              options={[
                { value: 'desc', label: 'Giảm dần' },
                { value: 'asc', label: 'Tăng dần' },
              ]}
            />

            <CustomSelect
              label="Số dòng"
              value={limit}
              onChange={(val) => {
                onLimitChange(val);
                onResetPage();
              }}
              options={[
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="btn-ghost mt-2 hidden w-full items-center justify-center gap-1.5 text-xs md:flex"
      >
        <span>{isExpanded ? 'Thu gọn bộ lọc' : 'Bộ lọc nâng cao'}</span>
        <svg 
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
    </div>
  );
}
