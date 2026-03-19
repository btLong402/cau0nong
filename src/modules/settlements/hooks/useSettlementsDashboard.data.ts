"use client";

import { useMemo } from "react";

import {
  useDebouncedValue,
  useGenerateMonthSettlements,
  useMarkSettlementPaid,
  useMonthSettlements,
} from "@/shared/hooks";

import { SettlementSortField } from "./useSettlementsDashboard";

interface UseSettlementsDashboardDataParams {
  months: Array<{ id: number; status: string; month_year: string }>;
  selectedMonthId: number | null;
  paymentFilter: "all" | "paid" | "unpaid";
  searchUser: string;
  page: number;
  limit: number;
  sortBy: SettlementSortField;
  sortOrder: "asc" | "desc";
  pageError: string | null;
}

export function useSettlementsDashboardData({
  months,
  selectedMonthId,
  paymentFilter,
  searchUser,
  page,
  limit,
  sortBy,
  sortOrder,
  pageError,
}: UseSettlementsDashboardDataParams) {
  const debouncedSearchUser = useDebouncedValue(searchUser, 350);

  const defaultMonthId = useMemo(() => {
    if (months.length === 0) {
      return null;
    }

    const openMonth = months.find((month) => month.status === "open");
    return openMonth?.id || months[0].id;
  }, [months]);

  const activeMonthId = selectedMonthId ?? defaultMonthId;

  const {
    settlements,
    pagination,
    loading: settlementsLoading,
    error: settlementsError,
    refetch,
  } = useMonthSettlements(activeMonthId, {
    page,
    limit,
    status: paymentFilter,
    search: debouncedSearchUser,
    sortBy,
    sortOrder,
  });

  const {
    generate,
    loading: generating,
    error: generateError,
    data: generateSummary,
  } = useGenerateMonthSettlements(activeMonthId);

  const {
    markPaid,
    loading: paying,
    error: payError,
  } = useMarkSettlementPaid();

  const totals = useMemo(() => {
    const totalDue = settlements.reduce((sum, item) => sum + item.total_due, 0);
    const unpaidCount = settlements.filter((item) => !item.is_paid).length;
    const paidCount = settlements.length - unpaidCount;

    return {
      totalDue,
      unpaidCount,
      paidCount,
    };
  }, [settlements]);

  const selectedMonth = months.find((item) => item.id === activeMonthId) || null;
  const combinedError =
    pageError || settlementsError?.message || generateError?.message || payError?.message || null;

  return {
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
  };
}
