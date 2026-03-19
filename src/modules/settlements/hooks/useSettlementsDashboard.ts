"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  SettlementListItem,
  useDebouncedValue,
  useGenerateMonthSettlements,
  useMarkSettlementPaid,
  useMonthSettlements,
  useMonths,
} from "@/shared/hooks";
import { useAuth } from "@/shared/hooks";

export type SettlementSortField = "total_due" | "created_at" | "paid_at" | "user_id";

function parseMonthId(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

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

  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(initialMonthId);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [searchUser, setSearchUser] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<SettlementSortField>("total_due");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementListItem | null>(null);
  const [activeTab, setActiveTab] = useState<"settlements" | "history" | "shuttlecocks">(
    "settlements",
  );

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

  const resetToFirstPage = () => {
    setPage(1);
  };

  const handleSortColumn = (field: SettlementSortField) => {
    setSortBy((prevSortBy) => {
      if (prevSortBy === field) {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
        return prevSortBy;
      }

      setSortOrder(field === "user_id" ? "asc" : "desc");
      return field;
    });

    resetToFirstPage();
  };

  const renderSortIndicator = (field: SettlementSortField) => {
    if (sortBy !== field) {
      return " ↕";
    }

    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  const handleGenerate = async (force = false) => {
    setPageError(null);

    try {
      await generate(force);
      resetToFirstPage();
      await refetch();
    } catch (generateActionError: unknown) {
      setPageError(getErrorMessage(generateActionError, "Không thể tạo dữ liệu quyết toán"));
    }
  };

  const handleConfirmPayment = async (item: SettlementListItem) => {
    setPageError(null);
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
    selectedMonthId,
    paymentFilter,
    searchUser,
    page,
    limit,
    sortBy,
    sortOrder,
    selectedSettlement,
    activeTab,
    generating,
    generateSummary,
    paying,
    totals,
    combinedError,
    setSelectedMonthId,
    setPaymentFilter,
    setSearchUser,
    setPage,
    setLimit,
    setSortBy,
    setSortOrder,
    setSelectedSettlement,
    setActiveTab,
    resetToFirstPage,
    handleSortColumn,
    renderSortIndicator,
    handleGenerate,
    handleConfirmPayment,
  };
}
