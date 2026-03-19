"use client";

import { useEffect } from "react";

import { DashboardMonth } from "./useSessionsDashboard";

interface UseSessionsDashboardDefaultsParams {
  months: DashboardMonth[];
  selectedMonth: number | null;
  setSelectedMonth: (monthId: number) => void;
  sessionDate: string;
  setSessionDate: (value: string) => void;
  users: Array<{ id: string }>;
  payerUserId: string;
  setPayerUserId: (userId: string) => void;
}

function getTodayDateValue(): string {
  return new Date().toISOString().split("T")[0];
}

export function useSessionsDashboardDefaults({
  months,
  selectedMonth,
  setSelectedMonth,
  sessionDate,
  setSessionDate,
  users,
  payerUserId,
  setPayerUserId,
}: UseSessionsDashboardDefaultsParams) {
  useEffect(() => {
    if (selectedMonth !== null || months.length === 0) {
      return;
    }

    const openMonth = months.find((month) => month.status === "open");
    if (openMonth) {
      setSelectedMonth(openMonth.id);
      return;
    }

    setSelectedMonth(months[0].id);
  }, [months, selectedMonth, setSelectedMonth]);

  useEffect(() => {
    if (!sessionDate) {
      setSessionDate(getTodayDateValue());
    }
  }, [sessionDate, setSessionDate]);

  useEffect(() => {
    if (!users.length || payerUserId) {
      return;
    }

    setPayerUserId(users[0].id);
  }, [payerUserId, setPayerUserId, users]);
}
