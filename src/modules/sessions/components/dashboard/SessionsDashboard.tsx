"use client";

import { SessionsDesktopTable } from "@/modules/sessions/components/dashboard/SessionsDesktopTable";
import { SessionsErrorState } from "@/modules/sessions/components/dashboard/SessionsErrorState";
import { SessionsHeader } from "@/modules/sessions/components/dashboard/SessionsHeader";
import { SessionsLoadingState } from "@/modules/sessions/components/dashboard/SessionsLoadingState";
import { SessionsMobileList } from "@/modules/sessions/components/dashboard/SessionsMobileList";
import { SessionsMonthSelector } from "@/modules/sessions/components/dashboard/SessionsMonthSelector";
import { NewSessionForm } from "@/modules/sessions/components/dashboard/NewSessionForm";
import { useSessionsDashboard } from "@/modules/sessions/hooks/useSessionsDashboard";

export function SessionsDashboard() {
  const {
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
    createSession,
    closeSession,
  } = useSessionsDashboard();

  if (hasDataError) {
    return <SessionsErrorState />;
  }

  if (loading) {
    return <SessionsLoadingState />;
  }

  const canCreate = authUser?.role === "admin" && Boolean(selectedMonth) && isMonthOpen;

  return (
    <div className="space-y-6">
      <SessionsHeader canCreate={canCreate} onToggleCreate={toggleNewSessionForm} />

      <SessionsMonthSelector
        months={months}
        selectedMonth={selectedMonth}
        onChange={setSelectedMonth}
      />

      <NewSessionForm
        visible={showNewSessionForm}
        formError={formError}
        sessionDate={sessionDate}
        courtExpense={courtExpense}
        payerUserId={payerUserId}
        notes={notes}
        users={users}
        creating={creating}
        creatingSession={creatingSession}
        onSessionDateChange={setSessionDate}
        onCourtExpenseChange={setCourtExpense}
        onPayerUserIdChange={setPayerUserId}
        onNotesChange={setNotes}
        onCreate={createSession}
        onCancel={closeNewSessionForm}
      />

      <SessionsDesktopTable
        sessions={sessions}
        users={users}
        authRole={authUser?.role}
        selectedMonthData={selectedMonthData}
        onCloseSession={closeSession}
      />

      <SessionsMobileList sessions={sessions} users={users} />
    </div>
  );
}
