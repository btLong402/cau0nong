import { describe, it, expect } from 'vitest';
import {
  calculateCourtFeePerPerson,
  calculateTotalCourtFeeInMonth,
  calculateShuttlecockFeePerPerson,
  calculateTotalDue,
  calculatePayerOffset,
  calculateEventDebtForUser,
  calculateEventContributionPerPerson,
  calculateBuyerOffset,
  calculateMonthlySettlement,
  getUsersParticipatedInMonth,
  calculatePastDebt,
  calculateCarriedBalance,
} from './calculations';
import type { Session, SessionAttendance, ShuttlecockDetail, EventParticipant, MonthlySetting } from './types';

describe('Calculations Engine', () => {
  describe('calculateCourtFeePerPerson', () => {
    it('should divide cost evenly among attendees', () => {
      expect(calculateCourtFeePerPerson(500000, 5)).toBe(100000);
      expect(calculateCourtFeePerPerson(300000, 4)).toBe(75000);
    });

    it('should return 0 if no attendees', () => {
      expect(calculateCourtFeePerPerson(500000, 0)).toBe(0);
    });
  });

  describe('calculateTotalCourtFeeInMonth', () => {
    const sessions: Session[] = [
      { id: 1, month_id: 1, session_date: '2023-10-01', court_expense_amount: 400000, payer_user_id: 'admin', status: 'open', created_at: '', updated_at: '' },
      { id: 2, month_id: 1, session_date: '2023-10-05', court_expense_amount: 600000, payer_user_id: 'admin', status: 'open', created_at: '', updated_at: '' },
    ];

    it('should calculate total court fee for a user based on their attendance', () => {
      const attendances: SessionAttendance[] = [
        // Session 1: 4 attendees = 100k each
        { id: 1, session_id: 1, user_id: 'u1', is_attended: true, created_at: '' },
        { id: 2, session_id: 1, user_id: 'u2', is_attended: true, created_at: '' },
        { id: 3, session_id: 1, user_id: 'u3', is_attended: true, created_at: '' },
        { id: 4, session_id: 1, user_id: 'u4', is_attended: true, created_at: '' },
        // Session 2: 3 attendees = 200k each
        { id: 5, session_id: 2, user_id: 'u1', is_attended: true, created_at: '' },
        { id: 6, session_id: 2, user_id: 'u2', is_attended: true, created_at: '' },
        { id: 7, session_id: 2, user_id: 'u3', is_attended: false, created_at: '' },
        { id: 8, session_id: 2, user_id: 'u5', is_attended: true, created_at: '' },
      ];

      expect(calculateTotalCourtFeeInMonth(sessions, attendances, 'u1')).toBe(300000); // 100k + 200k
      expect(calculateTotalCourtFeeInMonth(sessions, attendances, 'u3')).toBe(100000); // 100k + 0
      expect(calculateTotalCourtFeeInMonth(sessions, attendances, 'u5')).toBe(200000); // 0 + 200k
      expect(calculateTotalCourtFeeInMonth(sessions, attendances, 'non-existent')).toBe(0);
      
      // Test when session has no attendees at all
      const emptySessions = [{ id: 3, month_id: 1, session_date: '', court_expense_amount: 100, payer_user_id: '', status: 'open', created_at: '', updated_at: '' }];
      expect(calculateTotalCourtFeeInMonth(emptySessions, [], 'u1')).toBe(0);
    });
  });

  describe('calculateShuttlecockFeePerPerson', () => {
    it('should divide total shuttle cost among participants', () => {
      expect(calculateShuttlecockFeePerPerson(600000, 6)).toBe(100000);
    });

    it('should return 0 if no participants', () => {
      expect(calculateShuttlecockFeePerPerson(500000, 0)).toBe(0);
    });
  });

  describe('getUsersParticipatedInMonth', () => {
    it('should return unique user IDs who attended at least one session', () => {
      const attendances: SessionAttendance[] = [
        { id: 1, session_id: 1, user_id: 'u1', is_attended: true, created_at: '' },
        { id: 2, session_id: 1, user_id: 'u2', is_attended: false, created_at: '' },
        { id: 3, session_id: 2, user_id: 'u1', is_attended: true, created_at: '' },
        { id: 4, session_id: 2, user_id: 'u3', is_attended: true, created_at: '' },
      ];
      
      const participants = getUsersParticipatedInMonth(attendances);
      expect(participants).toContain('u1');
      expect(participants).toContain('u3');
      expect(participants).not.toContain('u2');
      expect(participants).toHaveLength(2);
    });
  });

  describe('offsets and debts', () => {
    it('calculatePayerOffset should sum up costs paid by the user', () => {
      const sessions: Session[] = [
        { id: 1, month_id: 1, session_date: '', court_expense_amount: 400000, payer_user_id: 'u1', status: 'open', created_at: '', updated_at: '' },
        { id: 2, month_id: 1, session_date: '', court_expense_amount: 600000, payer_user_id: 'u1', status: 'open', created_at: '', updated_at: '' },
        { id: 3, month_id: 1, session_date: '', court_expense_amount: 500000, payer_user_id: 'u2', status: 'open', created_at: '', updated_at: '' },
      ];
      expect(calculatePayerOffset(sessions, 'u1')).toBe(1000000);
      expect(calculatePayerOffset(sessions, 'u2')).toBe(500000);
      expect(calculatePayerOffset(sessions, 'u3')).toBe(0);
    });

    it('calculateBuyerOffset should sum up costs paid by the user for shuttlecocks', () => {
      const details: ShuttlecockDetail[] = [
        { id: 1, month_id: 1, purchase_date: '', quantity: 2, unit_price: 150000, buyer_user_id: 'u1', created_at: '' },
        { id: 2, month_id: 1, purchase_date: '', quantity: 1, unit_price: 100000, buyer_user_id: 'u2', created_at: '' },
      ];
      expect(calculateBuyerOffset(details, 'u1')).toBe(300000);
      expect(calculateBuyerOffset(details, 'u2')).toBe(100000);
      expect(calculateBuyerOffset(details, 'u3')).toBe(0);
    });

    it('calculateEventDebtForUser should sum up unpaid events', () => {
      const events: EventParticipant[] = [
        { id: 1, event_id: 1, user_id: 'u1', contribution_per_person: 200000, is_paid: false, created_at: '' },
        { id: 2, event_id: 2, user_id: 'u1', contribution_per_person: 150000, is_paid: true, created_at: '' }, // already paid
        { id: 3, event_id: 1, user_id: 'u2', contribution_per_person: 200000, is_paid: false, created_at: '' },
      ];
      expect(calculateEventDebtForUser(events, 'u1')).toBe(200000);
      expect(calculateEventDebtForUser(events, 'u2')).toBe(200000);
      expect(calculateEventDebtForUser(events, 'u3')).toBe(0);
    });
  });

  describe('calculateEventContributionPerPerson', () => {
    it('should calculate the individual contribution correctly', () => {
      // (1000000 - 200000) / 4 = 200000
      expect(calculateEventContributionPerPerson(1000000, 200000, 4)).toBe(200000);
    });

    it('should return 0 if no participants', () => {
      expect(calculateEventContributionPerPerson(1000000, 200000, 0)).toBe(0);
    });

    it('should not return negative if support > expense', () => {
      expect(calculateEventContributionPerPerson(500000, 1000000, 10)).toBe(0);
    });
  });

  describe('calculateTotalDue', () => {
    it('should sum up fees and debts then subtract balances and offsets', () => {
      const courtFee = 300000;
      const shuttleFee = 100000;
      const pastDebt = 50000;
      const carriedBalance = 20000;
      const courtPayerOffset = 400000; // Expected due = (300k+100k+50k) - (20k+400k) = 450k - 420k = 30k

      expect(calculateTotalDue(courtFee, shuttleFee, pastDebt, carriedBalance, courtPayerOffset)).toBe(30000);
    });

    it('should never return a negative total due', () => {
      const courtFee = 100000;
      const courtPayerOffset = 500000; // User paid more than they owe
      expect(calculateTotalDue(courtFee, 0, 0, 0, courtPayerOffset)).toBe(0);
    });

    it('should include event debt', () => {
      const courtFee = 100000;
      const eventDebt = 250000;
      expect(calculateTotalDue(courtFee, 0, 0, 0, 0, 0, eventDebt)).toBe(350000);
    });
  });

  describe('calculateMonthlySettlement', () => {
    it('should accurately generate a full monthly settlement for a user', () => {
      const sessions: Session[] = [
        { id: 1, month_id: 1, session_date: '', court_expense_amount: 400000, payer_user_id: 'admin', status: 'open', created_at: '', updated_at: '' },
      ];
      const attendances: SessionAttendance[] = [
        { id: 1, session_id: 1, user_id: 'u1', is_attended: true, created_at: '' },
        { id: 2, session_id: 1, user_id: 'u2', is_attended: true, created_at: '' },
      ]; // 2 attendees, 200k each
      
      const shuttlecockExpense: ShuttlecockDetail[] = [
        { id: 1, month_id: 1, purchase_date: '', quantity: 2, unit_price: 150000, buyer_user_id: 'admin', created_at: '' },
      ]; // Total 300k -> 2 participants -> 150k each

      const previousSettlement: MonthlySetting = {
        id: 99, month_id: 0, user_id: 'u1', court_fee: 0, shuttlecock_fee: 0, past_debt: 0, balance_carried: 0, court_payer_offset: 0, shuttlecock_buyer_offset: 0,
        event_debt: 0, total_due: 50000, is_paid: false, paid_amount: null, paid_at: null, created_at: ''
      }; // 50k past debt for u1

      const result = calculateMonthlySettlement({
        userId: 'u1',
        monthId: 1,
        sessions,
        attendances,
        shuttlecockExpense,
        previousSettlement,
      });

      expect(result.court_fee).toBe(200000);
      expect(result.shuttlecock_fee).toBe(150000);
      expect(result.past_debt).toBe(50000);
      expect(result.total_due).toBe(400000); // 200k + 150k + 50k
      expect(result.is_paid).toBe(false);
    });

    it('should correctly set is_paid to true if total_due is 0 (offset covers all)', () => {
      const sessions: Session[] = [
        { id: 1, month_id: 1, session_date: '', court_expense_amount: 400000, payer_user_id: 'u1', status: 'open', created_at: '', updated_at: '' },
      ];
      const attendances: SessionAttendance[] = [
        { id: 1, session_id: 1, user_id: 'u1', is_attended: true, created_at: '' },
        { id: 2, session_id: 1, user_id: 'u2', is_attended: true, created_at: '' },
      ]; // u1 owes 200k, but paid 400k (offset = 400k)
      
      const result = calculateMonthlySettlement({
        userId: 'u1',
        monthId: 1,
        sessions,
        attendances,
        shuttlecockExpense: [],
      });

      expect(result.court_fee).toBe(200000);
      expect(result.court_payer_offset).toBe(400000);
      expect(result.total_due).toBe(0);
      expect(result.is_paid).toBe(true);
      expect(result.paid_amount).toBe(0);
    });

    it('should handle carriedBalance branches explicitly', () => {
      const input = {
        userId: 'u1',
        monthId: 1,
        sessions: [],
        attendances: [],
        shuttlecockExpense: [],
      };
      
      // paid_amount < total_due -> no carried balance
      const r1 = calculateMonthlySettlement({
        ...input,
        previousSettlement: { total_due: 100, is_paid: false, paid_amount: 50 } as any,
      });
      expect(r1.past_debt).toBe(100);
      expect(r1.total_due).toBe(100);

      // paid_amount is null
      const r2 = calculateMonthlySettlement({
        ...input,
        previousSettlement: { total_due: 100, is_paid: false, paid_amount: null } as any,
      });
      expect(r2.past_debt).toBe(100);
      expect(r2.total_due).toBe(100);

      // paid_amount > total_due -> carried balance reduces total due
      const r3 = calculateMonthlySettlement({
        ...input,
        previousSettlement: { total_due: 100, is_paid: false, paid_amount: 150 } as any, // 50 carried balance
      });
      expect(r3.past_debt).toBe(100); 
      // court=0, past_debt=100, carried=50 -> total_due=50
      expect(r3.total_due).toBe(50);
    });
  });

  describe('calculatePastDebt & calculateCarriedBalance', () => {
    it('calculates past debt for unpaid settlements', () => {
      expect(calculatePastDebt([{ is_paid: false, total_due: 100 }, { is_paid: true, total_due: 50 }] as any)).toBe(100);
    });
    
    it('calculates carried balance (overpayment overflow)', () => {
      expect(calculateCarriedBalance()).toBe(0);
      expect(calculateCarriedBalance({ is_paid: true } as any)).toBe(0);
      expect(calculateCarriedBalance({ is_paid: false, total_due: 100, paid_amount: 150 } as any)).toBe(50);
      expect(calculateCarriedBalance({ is_paid: false, total_due: 100, paid_amount: 50 } as any)).toBe(0);
      expect(calculateCarriedBalance({ is_paid: false, total_due: 100, paid_amount: null } as any)).toBe(0);
    });
  });
});

