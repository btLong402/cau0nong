"use client";

import { useState } from "react";

import { SettlementListItem } from "@/shared/hooks";

import { SettlementSortField } from "./useSettlementsDashboard";

export type SettlementsDashboardTab = "settlements" | "history" | "shuttlecocks";

export function parseMonthId(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function useSettlementsDashboardState(initialMonthId: number | null) {
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(initialMonthId);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [searchUser, setSearchUser] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<SettlementSortField>("total_due");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementListItem | null>(null);
  const [activeTab, setActiveTab] = useState<SettlementsDashboardTab>("settlements");

  return {
    selectedMonthId,
    setSelectedMonthId,
    paymentFilter,
    setPaymentFilter,
    searchUser,
    setSearchUser,
    page,
    setPage,
    limit,
    setLimit,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    pageError,
    setPageError,
    selectedSettlement,
    setSelectedSettlement,
    activeTab,
    setActiveTab,
  };
}
