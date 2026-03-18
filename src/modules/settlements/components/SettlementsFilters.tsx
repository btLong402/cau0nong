'use client';

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

        <div>
          <label htmlFor="searchUser" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Tìm theo tên, email hoặc User ID
          </label>
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
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
          label="Số dòng mỗi trang"
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
  );
}
