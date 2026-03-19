interface UseSessionsDashboardActionsParams {
  selectedMonth: number | null;
  sessionDate: string;
  courtExpense: string;
  payerUserId: string;
  notes: string;
  create: (
    monthId: number,
    sessionDate: string,
    courtExpenseAmount: number,
    payerUserId: string,
    notes?: string,
  ) => Promise<unknown>;
  update: (
    monthId: number,
    sessionId: number,
    updates: { status: "closed" },
  ) => Promise<unknown>;
  refetchSessions: () => Promise<unknown>;
  setFormError: (value: string) => void;
  setCreating: (value: boolean) => void;
  setShowNewSessionForm: (value: boolean) => void;
  setCourtExpense: (value: string) => void;
  setNotes: (value: string) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useSessionsDashboardActions({
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
}: UseSessionsDashboardActionsParams) {
  const createSession = async () => {
    if (!selectedMonth || !sessionDate || !courtExpense || !payerUserId) {
      setFormError("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }

    setCreating(true);
    setFormError("");

    try {
      await create(selectedMonth, sessionDate, parseInt(courtExpense, 10), payerUserId, notes);
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
    createSession,
    closeSession,
  };
}
