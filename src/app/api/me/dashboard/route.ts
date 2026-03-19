/**
 * Member Dashboard API
 * Returns personal summary: current month dues, attendance, payment history, QR
 * 
 * GET /api/me/dashboard
 * Requires: authentication (any role)
 */

import { createGetHandler, type RequestContext } from "@/shared/api";
import { createSettlementsService } from "@/modules/settlements/settlements.service";
import { createMonthsService } from "@/modules/months/months.service";
import { createSessionsService } from "@/modules/sessions/sessions.service";
import { createUsersService } from "@/modules/users/users.service";

export const GET = createGetHandler({
  requireAuth: true,
  handler: async (req, context) => {
    const authContext = context as RequestContext;
    const userId = authContext.auth.userId;

    const usersService = await createUsersService();
    const monthsService = await createMonthsService();
    const sessionsService = await createSessionsService();
    const settlementsService = await createSettlementsService();

    // Get user profile
    let profile;
    try {
      profile = await usersService.getMember(userId);
    } catch {
      profile = null;
    }

    // Get current month
    const currentMonth = await monthsService.getCurrentMonth();

    let currentMonthData = null;
    let currentSettlement = null;
    let attendanceCount = 0;

    if (currentMonth) {
      // Get attendance count for current month
      attendanceCount = await sessionsService.getUserAttendanceCountInMonth(
        userId,
        currentMonth.id
      );

      // Get settlement for current month (if generated)
      const settlements = await settlementsService.listByMonth(currentMonth.id);
      currentSettlement = settlements.find((s) => s.user_id === userId) || null;

      // Get total sessions in current month
      const sessions = await sessionsService.listSessionsByMonth(currentMonth.id);

      currentMonthData = {
        month_id: currentMonth.id,
        month_year: currentMonth.month_year,
        status: currentMonth.status,
        total_sessions: sessions.length,
        sessions_attended: attendanceCount,
      };
    }

    // Get payment history (last 6 months of settlements)
    const allMonths = await monthsService.listMonths();
    const recentMonths = allMonths.slice(0, 6);

    const paymentHistory: Array<{
      month_year: string;
      court_fee: number;
      shuttlecock_fee: number;
      total_due: number;
      is_paid: boolean;
      paid_amount: number | null;
      paid_at: string | null;
    }> = [];

    for (const month of recentMonths) {
      const settlements = await settlementsService.listByMonth(month.id);
      const userSettlement = settlements.find((s) => s.user_id === userId);

      if (userSettlement) {
        paymentHistory.push({
          month_year: month.month_year,
          court_fee: userSettlement.court_fee,
          shuttlecock_fee: userSettlement.shuttlecock_fee,
          total_due: userSettlement.total_due,
          is_paid: userSettlement.is_paid,
          paid_amount: userSettlement.paid_amount,
          paid_at: userSettlement.paid_at,
        });
      }
    }

    return {
      profile: profile
        ? {
            id: profile.id,
            name: profile.name,
            phone: profile.phone,
            email: profile.email,
            avatar_url: profile.avatar_url || null,
            balance: profile.balance,
            role: profile.role,
          }
        : null,
      current_month: currentMonthData,
      current_settlement: currentSettlement
        ? {
            id: currentSettlement.id,
            court_fee: currentSettlement.court_fee,
            shuttlecock_fee: currentSettlement.shuttlecock_fee,
            past_debt: currentSettlement.past_debt,
            balance_carried: currentSettlement.balance_carried,
            court_payer_offset: currentSettlement.court_payer_offset,
            shuttlecock_buyer_offset: currentSettlement.shuttlecock_buyer_offset,
            event_debt: currentSettlement.event_debt,
            total_due: currentSettlement.total_due,
            is_paid: currentSettlement.is_paid,
            paid_amount: currentSettlement.paid_amount,
          }
        : null,
      payment_history: paymentHistory,
    };
  },
});
