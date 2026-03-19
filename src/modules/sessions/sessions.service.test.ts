import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionsService, createSessionsService } from './sessions.service';
import { SessionsRepository } from './sessions.repository';
import { AttendanceRepository } from './attendance.repository';
import * as sessionsRepoModule from './sessions.repository';
import * as attendanceRepoModule from './attendance.repository';

vi.mock('./sessions.repository', () => ({
  createSessionsRepository: vi.fn(),
}));

vi.mock('./attendance.repository', () => ({
  createAttendanceRepository: vi.fn(),
}));

// Mock dependencies
const mockSessionsRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByMonthSorted: vi.fn(),
  findByDate: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
} as unknown as SessionsRepository;

const mockAttendanceRepo = {
  bulkUpsertAttendance: vi.fn(),
  findBySession: vi.fn(),
  findByUserInMonth: vi.fn(),
} as unknown as AttendanceRepository;

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SessionsService(mockSessionsRepo, mockAttendanceRepo);
  });

  describe('createSession', () => {
    it('should validate date format (YYYY-MM-DD)', async () => {
      await expect(
        service.createSession({
          month_id: 1,
          session_date: '2023/10/01', // Invalid
          court_expense_amount: 100000,
          payer_user_id: 'u1',
        })
      ).rejects.toThrow('session_date phải có định dạng YYYY-MM-DD');
    });

    it('should validate court expense > 0', async () => {
      await expect(
        service.createSession({
          month_id: 1,
          session_date: '2023-10-01',
          court_expense_amount: 0, // Invalid
          payer_user_id: 'u1',
        })
      ).rejects.toThrow('court_expense_amount phải lớn hơn 0');
    });

    it('should set status to open on create and call repository', async () => {
      vi.mocked(mockSessionsRepo.create).mockResolvedValueOnce({ id: 1 } as any);

      const result = await service.createSession({
        month_id: 1,
        session_date: '2023-10-01',
        court_expense_amount: 200000,
        payer_user_id: 'u1',
      });

      expect(mockSessionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          session_date: '2023-10-01',
          court_expense_amount: 200000,
          status: 'open',
        })
      );
      expect(result.id).toBe(1);
    });
  });

  describe('updateSession', () => {
    it('should throw Error if session not found', async () => {
      vi.mocked(mockSessionsRepo.findById).mockResolvedValueOnce(null as any);
      await expect(
        service.updateSession(999, { court_expense_amount: 100 })
      ).rejects.toThrow('Không tìm thấy buổi tập');
    });

    it('should validate court expense if updated', async () => {
      vi.mocked(mockSessionsRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      await expect(
        service.updateSession(1, { court_expense_amount: -50000 })
      ).rejects.toThrow('court_expense_amount phải lớn hơn 0');
    });

    it('should successfully update status', async () => {
      vi.mocked(mockSessionsRepo.findById).mockResolvedValueOnce({ 
        id: 1, 
        status: 'open',
        court_expense_amount: 100000 
      } as any);

      vi.mocked(mockSessionsRepo.updateSession).mockResolvedValueOnce({ id: 1, status: 'closed' } as any);

      const result = await service.updateSession(1, { status: 'closed' });

      expect(mockSessionsRepo.updateSession).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'closed' })
      );
      expect(result.status).toBe('closed');
    });

    it('should update notes safely', async () => {
      vi.mocked(mockSessionsRepo.findById).mockResolvedValueOnce({ id: 1, notes: 'old' } as any);
      vi.mocked(mockSessionsRepo.updateSession).mockResolvedValueOnce({ id: 1 } as any);
      await service.updateSession(1, { notes: 'new notes' });
      expect(mockSessionsRepo.updateSession).toHaveBeenCalledWith(1, expect.objectContaining({ notes: 'new notes' }));
    });
  });

  describe('recordAttendance', () => {
    it('should verify session exists before recording attendance', async () => {
      vi.mocked(mockSessionsRepo.findById).mockResolvedValueOnce(null as any);

      await expect(
        service.recordAttendance(1, [{ userId: 'u1', isAttended: true }])
      ).rejects.toThrow('Không tìm thấy buổi tập');
      
      expect(mockAttendanceRepo.bulkUpsertAttendance).not.toHaveBeenCalled();
    });

    it('should call bulkUpsertAttendance repository method if valid', async () => {
      vi.mocked(mockSessionsRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockAttendanceRepo.bulkUpsertAttendance).mockResolvedValueOnce([]);

      await service.recordAttendance(1, [{ userId: 'u1', isAttended: true }]);

      expect(mockAttendanceRepo.bulkUpsertAttendance).toHaveBeenCalledWith(
        1,
        [{ userId: 'u1', isAttended: true }]
      );
    });
  });

  describe('deleteSession', () => {
    it('should verify session exists and delete', async () => {
      vi.mocked(mockSessionsRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockSessionsRepo.deleteSession).mockResolvedValueOnce(true);

      const result = await service.deleteSession(1);
      
      expect(mockSessionsRepo.deleteSession).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('Attendance Queries', () => {
    it('getSessionAttendance should throw if session not found', async () => {
      vi.mocked(mockSessionsRepo.findById).mockResolvedValueOnce(null as any);
      await expect(service.getSessionAttendance(1)).rejects.toThrow('Không tìm thấy buổi tập');
    });

    it('getSessionAttendance should return attendance records', async () => {
      vi.mocked(mockSessionsRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockAttendanceRepo.findBySession).mockResolvedValueOnce([{ id: 1 }] as any);
      
      const result = await service.getSessionAttendance(1);
      expect(result).toHaveLength(1);
    });

    it('listSessionsByMonth should return sessions sorted', async () => {
      vi.mocked(mockSessionsRepo.findByMonthSorted).mockResolvedValueOnce([{ id: 1 }] as any);
      const result = await service.listSessionsByMonth(1);
      expect(result).toHaveLength(1);
    });

    it('getUserMonthlyAttendance should return user records', async () => {
      vi.mocked(mockAttendanceRepo.findByUserInMonth).mockResolvedValueOnce([{ id: 1 }] as any);
      const result = await service.getUserMonthlyAttendance('u1', 1);
      expect(result).toHaveLength(1);
    });

    it('getSessionAttendanceCount should return count of attended', async () => {
      vi.mocked(mockAttendanceRepo.findBySession).mockResolvedValueOnce([
        { is_attended: true },
        { is_attended: false },
        { is_attended: true },
      ] as any);
      const count = await service.getSessionAttendanceCount(1);
      expect(count).toBe(2);
    });

    it('getUserAttendanceCountInMonth should return count of attended', async () => {
      vi.mocked(mockAttendanceRepo.findByUserInMonth).mockResolvedValueOnce([
        { is_attended: true },
        { is_attended: false },
      ] as any);
      const count = await service.getUserAttendanceCountInMonth('u1', 1);
      expect(count).toBe(1);
    });
  });

  describe('createSessionsService', () => {
    it('should initialize repositories and return instance', async () => {
      vi.mocked(sessionsRepoModule.createSessionsRepository).mockResolvedValueOnce(mockSessionsRepo as any);
      vi.mocked(attendanceRepoModule.createAttendanceRepository).mockResolvedValueOnce(mockAttendanceRepo as any);
      
      const srv = await createSessionsService();
      
      expect(srv).toBeInstanceOf(SessionsService);
      expect(sessionsRepoModule.createSessionsRepository).toHaveBeenCalled();
      expect(attendanceRepoModule.createAttendanceRepository).toHaveBeenCalled();
    });
  });
});
