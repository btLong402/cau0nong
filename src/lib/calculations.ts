/**
 * Settlement & Payment Calculation Engines
 * Contains all formulas outlined in business specification
 */

import type {
  Session,
  SessionAttendance,
  ShuttlecockDetail,
  MonthlySetting,
  EventParticipant,
  User,
} from "./types";

/**
 * 4.1 Tiền sân cá nhân theo từng ngày
 * tien_san_ca_nhan(ngay_A) = tong_tien_san(ngay_A) / so_nguoi_diem_danh(ngay_A)
 *
 * @param courtExpenseAmount - tổng tiền sân buổi đó
 * @param attendeeCount - số người có is_attended = true
 * @returns tiền sân cá nhân (hoặc 0 nếu không dự)
 */
export const calculateCourtFeePerPerson = (
  courtExpenseAmount: number,
  attendeeCount: number
): number => {
  if (attendeeCount === 0) return 0;
  return courtExpenseAmount / attendeeCount;
};

/**
 * Tính tổng tiền sân các buổi trong tháng cho 1 user
 * = sum(tiền sân cá nhân của từng buổi có dự)
 */
export const calculateTotalCourtFeeInMonth = (
  sessions: Session[],
  attendances: SessionAttendance[],
  userId: string
): number => {
  let total = 0;

  sessions.forEach((session) => {
    const sessionAttendees = attendances.filter(
      (a) => a.session_id === session.id && a.is_attended
    );
    const attendeeCount = sessionAttendees.length;

    if (attendeeCount === 0) return;

    const userAttendance = sessionAttendees.find((a) => a.user_id === userId);
    if (userAttendance) {
      const fee = calculateCourtFeePerPerson(
        session.court_expense_amount,
        attendeeCount
      );
      total += fee;
    }
  });

  return Math.round(total * 100) / 100; // round to 2 decimals
};

/**
 * 4.2 Tiền cầu cá nhân theo tháng
 * tien_cau_ca_nhan(thang) = tong_tien_cau(thang) / so_nguoi_co_tham_gia_it_nhat_1_buoi(thang)
 *
 * @param totalShuttlecockExpense - tổng tiền mua cầu tháng đó
 * @param usersWhoParticipated - danh sách user_id tham gia ít nhất 1 buổi
 * @returns tiền cầu cá nhân
 */
export const calculateShuttlecockFeePerPerson = (
  totalShuttlecockExpense: number,
  participantCount: number
): number => {
  if (participantCount === 0) return 0;
  return totalShuttlecockExpense / participantCount;
};

/**
 * Tìm danh sách user tham gia tháng (có ít nhất 1 buổi)
 */
export const getUsersParticipatedInMonth = (
  attendances: SessionAttendance[]
): string[] => {
  const userSet = new Set<string>();
  attendances.forEach((a) => {
    if (a.is_attended) {
      userSet.add(a.user_id);
    }
  });
  return Array.from(userSet);
};

/**
 * 4.3 Nợ tồn đọng & Số dư
 * no_cu = tổng các khoản chưa thanh toán của tháng trước (is_paid = false)
 * so_du = tiền thực tế chuyển - tiền hệ thống báo cần đóng (dương = du, âm = nợ)
 */
export const calculatePastDebt = (previousSettlements: MonthlySetting[]): number => {
  return previousSettlements
    .filter((s) => !s.is_paid)
    .reduce((sum, s) => sum + s.total_due, 0);
};

export const calculateCarriedBalance = (
  previousSettlement?: MonthlySetting
): number => {
  if (!previousSettlement) return 0;
  
  // Total costs the user was responsible for in the previous month
  const totalCosts = 
    previousSettlement.court_fee + 
    previousSettlement.shuttlecock_fee + 
    previousSettlement.past_debt + 
    (previousSettlement.event_debt || 0);
    
  // Total "funds" provided by the user (previous balance + new offsets + actual payment)
  const totalFunds = 
    previousSettlement.balance_carried + 
    previousSettlement.court_payer_offset + 
    previousSettlement.shuttlecock_buyer_offset + 
    (previousSettlement.paid_amount || 0);
    
  const netBalance = totalFunds - totalCosts;
  
  // If positive, it's credit carried forward to the current month.
  return netBalance > 0 ? Math.round(netBalance * 100) / 100 : 0;
};

/**
 * 4.4 Tổng tiền cần thanh toán tháng
 * tong_can_dong = tong_tien_san_ca_nhan_trong_thang
 *               + tien_cau_ca_nhan
 *               + no_ton_dong
 *               + event_debt
 *               - so_du
 *               - court_payer_offset
 *               - shuttlecock_buyer_offset
 */
export const calculateTotalDue = (
  courtFee: number,
  shuttlecockFee: number,
  pastDebt: number,
  carriedBalance: number,
  courtPayerOffset: number = 0,
  shuttlecockBuyerOffset: number = 0,
  eventDebt: number = 0,
): number => {
  const total = courtFee + shuttlecockFee + pastDebt + eventDebt
    - carriedBalance - courtPayerOffset - shuttlecockBuyerOffset;
  return Math.max(0, Math.round(total * 100) / 100); // never negative
};

/**
 * 4.5 Công thức chia tiền sự kiện
 * tien_dong_them_moi_nguoi = (tong_chi_phi_su_kien - tong_tai_tro_ho_tro) / so_nguoi_tham_gia
 */
export const calculateEventContributionPerPerson = (
  totalExpense: number,
  totalSupport: number,
  participantCount: number
): number => {
  if (participantCount === 0) return 0;
  const deficit = totalExpense - totalSupport;
  return Math.max(0, Math.round((deficit / participantCount) * 100) / 100);
};

/**
 * Calculate court payer offset for a user in a month
 * If user paid for court rental, that amount is deducted from their dues
 */
export const calculatePayerOffset = (
  sessions: Session[],
  userId: string
): number => {
  let total = 0;
  for (const session of sessions) {
    if (session.payer_user_id === userId) {
      total += session.court_expense_amount;
    }
  }
  return Math.round(total * 100) / 100;
};

/**
 * Calculate shuttlecock buyer offset for a user in a month
 * If user bought shuttlecocks, that amount is deducted from their dues
 */
export const calculateBuyerOffset = (
  shuttlecockDetails: ShuttlecockDetail[],
  userId: string
): number => {
  let total = 0;
  for (const detail of shuttlecockDetails) {
    if (detail.buyer_user_id === userId) {
      total += detail.quantity * detail.unit_price;
    }
  }
  return Math.round(total * 100) / 100;
};

/**
 * Calculate event debt for a user
 * Sum of unpaid event contributions linked to this month
 */
export const calculateEventDebtForUser = (
  eventParticipants: EventParticipant[],
  userId: string
): number => {
  let total = 0;
  for (const ep of eventParticipants) {
    if (ep.user_id === userId && !ep.is_paid && ep.contribution_per_person > 0) {
      total += ep.contribution_per_person;
    }
  }
  return Math.round(total * 100) / 100;
};

/**
 * Main settlement calculation engine
 * Tính toàn bộ số tiền cần đóng cho 1 user trong 1 tháng
 */
export interface SettlementInput {
  userId: string;
  monthId: number;
  sessions: Session[];
  attendances: SessionAttendance[];
  shuttlecockExpense: ShuttlecockDetail[];
  previousSettlement?: MonthlySetting;
  eventParticipants?: EventParticipant[];
}

export const calculateMonthlySettlement = (input: SettlementInput): Omit<MonthlySetting, 'id' | 'created_at'> => {
  const {
    userId,
    sessions,
    attendances,
    shuttlecockExpense,
    previousSettlement,
    eventParticipants,
  } = input;

  // Step 1: Tính tiền sân cá nhân các buổi trong tháng
  const courtFee = calculateTotalCourtFeeInMonth(sessions, attendances, userId);

  // Step 2: Tính tiền cầu cá nhân
  const participantUsers = getUsersParticipatedInMonth(attendances);
  const totalShuttlecockCost = shuttlecockExpense.reduce(
    (sum, s) => sum + s.quantity * s.unit_price,
    0
  );
  const shuttlecockFee = calculateShuttlecockFeePerPerson(
    totalShuttlecockCost,
    participantUsers.length
  );

  // Step 3: Lấy nợ cũ & số dư từ tháng trước
  const pastDebt = previousSettlement && !previousSettlement.is_paid 
    ? previousSettlement.total_due 
    : 0;
  
  const carriedBalance = calculateCarriedBalance(previousSettlement);

  // Step 4: Tính offset cho người ứng tiền
  const courtPayerOffset = calculatePayerOffset(sessions, userId);
  const shuttlecockBuyerOffset = calculateBuyerOffset(shuttlecockExpense, userId);

  // Step 5: Tính event debt
  const eventDebt = eventParticipants
    ? calculateEventDebtForUser(eventParticipants, userId)
    : 0;

  // Step 6: Tính tổng tiền cần đóng
  const totalDue = calculateTotalDue(
    courtFee,
    shuttlecockFee,
    pastDebt,
    carriedBalance,
    courtPayerOffset,
    shuttlecockBuyerOffset,
    eventDebt,
  );

  const isPaid = totalDue === 0;

  return {
    month_id: input.monthId,
    user_id: userId,
    court_fee: courtFee,
    shuttlecock_fee: shuttlecockFee,
    past_debt: pastDebt,
    balance_carried: carriedBalance,
    court_payer_offset: courtPayerOffset,
    shuttlecock_buyer_offset: shuttlecockBuyerOffset,
    event_debt: eventDebt,
    total_due: totalDue,
    is_paid: isPaid,
    paid_amount: isPaid ? 0 : null,
    paid_at: isPaid ? new Date().toISOString() : null,
  } as Omit<MonthlySetting, 'id' | 'created_at'>;
};
