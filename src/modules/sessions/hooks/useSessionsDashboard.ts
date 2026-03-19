"use client";

import { useMemo, useState } from "react";

import {
  useAuth,
  useCreateSession,
  useMembers,
  useMonths,
  useSessions,
  useUpdateSession,
} from "@/shared/hooks";
import { useSessionsDashboardActions } from "@/modules/sessions/hooks/useSessionsDashboard.actions";
import { useSessionsDashboardDefaults } from "@/modules/sessions/hooks/useSessionsDashboard.defaults";

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

  useSessionsDashboardDefaults({
    months,
    selectedMonth,
    setSelectedMonth,
    sessionDate,
    setSessionDate,
    users,
    payerUserId,
    setPayerUserId,
  });

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

  const { createSession, closeSession } = useSessionsDashboardActions({
    selectedMonth,
    sessionDate,
    courtExpense,
    payerUserId,
    notes,
    create,
    update,
    refetchSessions,
    setFormError,
    setCreating,
    setShowNewSessionForm,
    setCourtExpense,
    setNotes,
  });

  const sessionFormState = {
    sessionDate,
    setSessionDate,
    courtExpense,
    setCourtExpense,
    payerUserId,
    setPayerUserId,
    notes,
    setNotes,
    formError,
  };

  const sessionUiState = {
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
  };

  return {
    authUser,
    months,
    users,
    sessions,
    ...sessionUiState,
    ...sessionFormState,
    createSession,
    closeSession,
  };
}
