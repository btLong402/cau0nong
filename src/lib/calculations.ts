/**
 * Settlement & Payment Calculation Engines
 * Contains all formulas outlined in business specification
 */

import type {
  Session,
  SessionAttendance,
  ShuttlecockDetail,
  MonthlySetting,
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
  if (previousSettlement.is_paid) {
    // Nếu thanh toán đủ, không có số dư
    return 0;
  }
  // Nếu thanh toán thừa
  const overpaid = (previousSettlement.paid_amount || 0) - previousSettlement.total_due;
  return overpaid > 0 ? overpaid : 0;
};

/**
 * 4.4 Tổng tiền cần thanh toán tháng
 * tong_can_dong = tong_tien_san_ca_nhan_trong_thang
 *               + tien_cau_ca_nhan
 *               + no_ton_dong
 *               - so_du
 */
export const calculateTotalDue = (
  courtFee: number,
  shuttlecockFee: number,
  pastDebt: number,
  carriedBalance: number
): number => {
  const total = courtFee + shuttlecockFee + pastDebt - carriedBalance;
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
}

export const calculateMonthlySettlement = (input: SettlementInput): Omit<MonthlySetting, 'id' | 'created_at'> => {
  const {
    userId,
    sessions,
    attendances,
    shuttlecockExpense,
    previousSettlement,
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
  
  const carriedBalance =
    previousSettlement &&
    previousSettlement.paid_amount &&
    previousSettlement.paid_amount > previousSettlement.total_due
      ? previousSettlement.paid_amount - previousSettlement.total_due
      : 0;

  // Step 4: Tính tổng tiền cần đóng
  const totalDue = calculateTotalDue(
    courtFee,
    shuttlecockFee,
    pastDebt,
    carriedBalance
  );

  return {
    month_id: input.monthId,
    user_id: userId,
    court_fee: courtFee,
    shuttlecock_fee: shuttlecockFee,
    past_debt: pastDebt,
    balance_carried: carriedBalance,
    total_due: totalDue,
    is_paid: false,
    paid_amount: null,
    paid_at: null,
  } as Omit<MonthlySetting, 'id' | 'created_at'>;
};
