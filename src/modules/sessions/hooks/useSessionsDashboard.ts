"use client";

import { useEffect, useMemo, useState } from "react";

import {
  useAuth,
  useCreateSession,
  useMembers,
  useMonths,
  useSessions,
  useUpdateSession,
} from "@/shared/hooks";

export interface DashboardMonth {
  id: number;
  month_year: string;
  status: string;
}

export interface DashboardSession {
  id: number;
  session_date: string;
  court_expense_amount: number;
  payer_user_id: string;
  notes?: string;
  status: "open" | "closed";
}

function getTodayDateValue(): string {
  return new Date().toISOString().split("T")[0];
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useSessionsDashboard() {
  const { user: authUser } = useAuth();
  const { months, loading: monthsLoading, error: monthsError } = useMonths();

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useSessions(selectedMonth ?? 0);

  const { members: users } = useMembers(1, 200, {
    enabled: authUser?.role === "admin",
  });

  const { create, loading: creatingSession } = useCreateSession();
  const { update } = useUpdateSession();

  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [sessionDate, setSessionDate] = useState("");
  const [courtExpense, setCourtExpense] = useState("");
  const [payerUserId, setPayerUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (selectedMonth !== null || months.length === 0) {
      return;
    }

    const openMonth = months.find((month: DashboardMonth) => month.status === "open");
    if (openMonth) {
      setSelectedMonth(openMonth.id);
      return;
    }

    setSelectedMonth(months[0].id);
  }, [months, selectedMonth]);

  useEffect(() => {
    if (!sessionDate) {
      setSessionDate(getTodayDateValue());
    }
  }, [sessionDate]);

  useEffect(() => {
    if (!users.length || payerUserId) {
      return;
    }

    setPayerUserId(users[0].id);
  }, [payerUserId, users]);

  const selectedMonthData = useMemo(
    () => months.find((month: DashboardMonth) => month.id === selectedMonth),
    [months, selectedMonth],
  );

  const isMonthOpen = selectedMonthData?.status === "open";

  const loading = monthsLoading || (selectedMonth !== null && sessionsLoading);

  const hasDataError = Boolean(monthsError || sessionsError);

  const toggleNewSessionForm = () => {
    setShowNewSessionForm((prev) => !prev);
  };

  const closeNewSessionForm = () => {
    setShowNewSessionForm(false);
  };

  const createSession = async () => {
    if (!selectedMonth || !sessionDate || !courtExpense || !payerUserId) {
      setFormError("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }

    setCreating(true);
    setFormError("");

    try {
      await create(
        selectedMonth,
        sessionDate,
        parseInt(courtExpense, 10),
        payerUserId,
        notes,
      );
      await refetchSessions();
      setShowNewSessionForm(false);
      setCourtExpense("");
      setNotes("");
    } catch (createError: unknown) {
      setFormError(getErrorMessage(createError, "Không thể tạo buổi tập."));
    } finally {
      setCreating(false);
    }
  };

  const closeSession = async (sessionId: number) => {
    if (!selectedMonth) {
      return;
    }

    try {
      await update(selectedMonth, sessionId, { status: "closed" });
      await refetchSessions();
    } catch (closeError) {
      console.error("Error closing session:", closeError);
    }
  };

  return {
    authUser,
    months,
    users,
    sessions,
    selectedMonth,
    setSelectedMonth,
    selectedMonthData,
    isMonthOpen,
    loading,
    hasDataError,
    showNewSessionForm,
    toggleNewSessionForm,
    closeNewSessionForm,
    creating,
    creatingSession,
    sessionDate,
    setSessionDate,
    courtExpense,
    setCourtExpense,
    payerUserId,
    setPayerUserId,
    notes,
    setNotes,
    formError,
    setFormError,
    createSession,
    closeSession,
  };
}
