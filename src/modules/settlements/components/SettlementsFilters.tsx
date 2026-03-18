'use client';

import { Month } from '@/shared/hooks';

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
        <div>
          <label htmlFor="monthSelect" className="mb-2 block text-sm font-medium text-slate-700">
            Chọn kỳ quản lý
          </label>
          <select
            id="monthSelect"
            value={activeMonthId || ''}
            onChange={(event) => onMonthChange(Number(event.target.value))}
            onBlur={onResetPage}
            className="input-field"
          >
            {months.map((month) => (
              <option key={month.id} value={month.id}>
                {formatMonthLabel(month.month_year)} ({month.status === 'open' ? 'Đang mở' : 'Đã đóng'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="statusFilter" className="mb-2 block text-sm font-medium text-slate-700">
            Lọc thanh toán
          </label>
          <select
            id="statusFilter"
            value={paymentFilter}
            onChange={(event) => {
              onPaymentFilterChange(event.target.value as 'all' | 'paid' | 'unpaid');
              onResetPage();
            }}
            className="input-field"
          >
            <option value="all">Tất cả</option>
            <option value="paid">Đã thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
          </select>
        </div>

        <div>
          <label htmlFor="searchUser" className="mb-2 block text-sm font-medium text-slate-700">
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
        <div>
          <label htmlFor="sortBy" className="mb-2 block text-sm font-medium text-slate-700">
            Sắp xếp theo
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(event) => {
              onSortByChange(event.target.value as 'total_due' | 'created_at' | 'paid_at' | 'user_id');
              onResetPage();
            }}
            className="input-field"
          >
            <option value="total_due">Tổng cần thu</option>
            <option value="created_at">Ngày tạo quyết toán</option>
            <option value="paid_at">Ngày thanh toán</option>
            <option value="user_id">User ID</option>
          </select>
        </div>

        <div>
          <label htmlFor="sortOrder" className="mb-2 block text-sm font-medium text-slate-700">
            Thứ tự
          </label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(event) => {
              onSortOrderChange(event.target.value as 'asc' | 'desc');
              onResetPage();
            }}
            className="input-field"
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>
        </div>

        <div>
          <label htmlFor="pageSize" className="mb-2 block text-sm font-medium text-slate-700">
            Số dòng mỗi trang
          </label>
          <select
            id="pageSize"
            value={String(limit)}
            onChange={(event) => {
              onLimitChange(Number(event.target.value));
              onResetPage();
            }}
            className="input-field"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>
  );
}
