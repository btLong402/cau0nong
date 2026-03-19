"use client";

import { useSearchParams } from "next/navigation";

import { SettlementListItem, useMonths } from "@/shared/hooks";
import { useAuth } from "@/shared/hooks";

import { useSettlementsDashboardData } from "./useSettlementsDashboard.data";
import {
  parseMonthId,
  useSettlementsDashboardState,
} from "./useSettlementsDashboard.state";

export type SettlementSortField = "total_due" | "created_at" | "paid_at" | "user_id";

export function formatSettlementCurrency(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")} đ`;
}

export function formatSettlementMonthLabel(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useSettlementsDashboard() {
  const { user: authUser } = useAuth();
  const { months, loading: monthsLoading, error: monthsError } = useMonths();

  const searchParams = useSearchParams();
  const initialMonthId = parseMonthId(searchParams.get("monthId"));

  const state = useSettlementsDashboardState(initialMonthId);

  const {
    settlements,
    pagination,
    settlementsLoading,
    activeMonthId,
    selectedMonth,
    generate,
    generating,
    generateSummary,
    markPaid,
    paying,
    totals,
    combinedError,
    refetch,
  } = useSettlementsDashboardData({
    months,
    selectedMonthId: state.selectedMonthId,
    paymentFilter: state.paymentFilter,
    searchUser: state.searchUser,
    page: state.page,
    limit: state.limit,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    pageError: state.pageError,
  });

  const resetToFirstPage = () => {
    state.setPage(1);
  };

  const handleSortColumn = (field: SettlementSortField) => {
    state.setSortBy((prevSortBy) => {
      if (prevSortBy === field) {
        state.setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
        return prevSortBy;
      }

      state.setSortOrder(field === "user_id" ? "asc" : "desc");
      return field;
    });

    state.setPage(1);
  };

  const renderSortIndicator = (field: SettlementSortField) => {
    if (state.sortBy !== field) {
      return " ↕";
    }

    return state.sortOrder === "asc" ? " ↑" : " ↓";
  };

  const handleGenerate = async (force = false) => {
    state.setPageError(null);

    try {
      await generate(force);
      resetToFirstPage();
      await refetch();
    } catch (generateActionError: unknown) {
      state.setPageError(getErrorMessage(generateActionError, "Không thể tạo dữ liệu quyết toán"));
    }
  };

  const handleConfirmPayment = async (item: SettlementListItem) => {
    state.setPageError(null);
    await markPaid(item.id, item.total_due);
    await refetch();
  };

  return {
    authUser,
    months,
    monthsLoading,
    monthsError,
    settlements,
    settlementsLoading,
    pagination,
    activeMonthId,
    selectedMonth,
    generating,
    generateSummary,
    paying,
    totals,
    combinedError,
    ...state,
    resetToFirstPage,
    handleSortColumn,
    renderSortIndicator,
    handleGenerate,
    handleConfirmPayment,
  };
}
