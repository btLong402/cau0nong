import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettlementsService, createSettlementsService } from './settlements.service';
import { SettlementsRepository } from './settlements.repository';
import * as settlementsRepoModule from './settlements.repository';

vi.mock('./settlements.repository', () => ({
  createSettlementsRepository: vi.fn(),
}));

// Mock dependencies
vi.mock('@/modules/months/months.service', () => ({
  createMonthsService: vi.fn().mockResolvedValue({
    getMonth: vi.fn().mockResolvedValue({ id: 1, status: 'open' })
  })
}));

const mockGetSessionAttendance = vi.fn();
const mockListSessionsByMonth = vi.fn();

vi.mock('@/modules/sessions/sessions.service', () => ({
  createSessionsService: vi.fn().mockResolvedValue({
    listSessionsByMonth: (...args: any[]) => mockListSessionsByMonth(...args),
    getSessionAttendance: (...args: any[]) => mockGetSessionAttendance(...args)
  })
}));

vi.mock('@/modules/shuttlecocks/shuttlecocks.repository', () => ({
  createShuttlecocksRepository: vi.fn().mockResolvedValue({
    findByMonth: vi.fn().mockResolvedValue([])
  })
}));

vi.mock('@/modules/events/events.repository', () => ({
  createEventsRepository: vi.fn().mockResolvedValue({
    supabase: {
      from: () => ({
        select: () => ({
          eq: vi.fn().mockResolvedValue({ data: [] })
        })
      })
    }
  })
}));

vi.mock('@/modules/events/event-participants.repository', () => ({
  createEventParticipantsRepository: vi.fn().mockResolvedValue({
    findByEvent: vi.fn().mockResolvedValue([])
  })
}));

// Mock Settlements Repo
const mockSettlementsRepo = {
  findByMonth: vi.fn(),
  findByMonthPaginated: vi.fn(),
  findById: vi.fn(),
  findPreviousByUser: vi.fn(),
  upsertByMonthAndUser: vi.fn(),
  markPaid: vi.fn(),
} as unknown as SettlementsRepository;


describe('SettlementsService', () => {
  let service: SettlementsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SettlementsService(mockSettlementsRepo);
  });

  describe('markPaid', () => {
    it('should throw error if already paid', async () => {
      vi.mocked(mockSettlementsRepo.findById).mockResolvedValueOnce({
        id: 1,
        is_paid: true,
        total_due: 100000
      } as any);

      await expect(service.markPaid(1)).rejects.toThrow('Settlement is already marked as paid');
    });

    it('should throw error if paid amount does not match total due', async () => {
      vi.mocked(mockSettlementsRepo.findById).mockResolvedValueOnce({
        id: 1,
        is_paid: false,
        total_due: 100000
      } as any);

      await expect(service.markPaid(1, 50000)).rejects.toThrow('paidAmount must be equal to settlement total_due');
    });

    it('should throw ValidationError if paidAmount is negative', async () => {
      vi.mocked(mockSettlementsRepo.findById).mockResolvedValueOnce({
        id: 1, is_paid: false, total_due: 100000
      } as any);

      await expect(service.markPaid(1, -50000)).rejects.toThrow('paidAmount must be >= 0');
    });

    it('should successfully mark as paid when valid', async () => {
      vi.mocked(mockSettlementsRepo.findById).mockResolvedValueOnce({
        id: 1,
        is_paid: false,
        total_due: 100000
      } as any);

      vi.mocked(mockSettlementsRepo.markPaid).mockResolvedValueOnce({
        id: 1,
        is_paid: true,
        paid_amount: 100000
      } as any);

      const result = await service.markPaid(1);
      
      expect(mockSettlementsRepo.markPaid).toHaveBeenCalledWith(1, 100000);
      expect(result.is_paid).toBe(true);
    });
  });

  describe('generateForMonth', () => {
    it('should throw if settlements already exist and force is not true', async () => {
      vi.mocked(mockSettlementsRepo.findByMonth).mockResolvedValueOnce([{ id: 1 } as any]);

      await expect(service.generateForMonth(1)).rejects.toThrow(
        'Settlements for this month already exist. Use force=true to regenerate.'
      );
    });

    it('should throw if no sessions found in the month', async () => {
      vi.mocked(mockSettlementsRepo.findByMonth).mockResolvedValueOnce([]); // No existing
      mockListSessionsByMonth.mockResolvedValueOnce([]); // No sessions

      await expect(service.generateForMonth(1)).rejects.toThrow(
        'Cannot generate settlements for a month with no sessions'
      );
    });

    it('should successfully generate settlements when valid', async () => {
      vi.mocked(mockSettlementsRepo.findByMonth).mockResolvedValueOnce([]); 
      mockListSessionsByMonth.mockResolvedValueOnce([{ id: 1, court_expense_amount: 200000 }]); 
      
      // Mock 2 attendees
      mockGetSessionAttendance.mockResolvedValueOnce([
        { session_id: 1, user_id: 'u1', is_attended: true },
        { session_id: 1, user_id: 'u2', is_attended: true },
      ]);

      vi.mocked(mockSettlementsRepo.findPreviousByUser).mockResolvedValue(null);
      vi.mocked(mockSettlementsRepo.upsertByMonthAndUser).mockImplementationOnce(async (rows) => {
        return rows.map((r, i) => ({ id: i + 1, ...r })) as any;
      });

      const result = await service.generateForMonth(1);

      expect(result.monthId).toBe(1);
      expect(result.generatedCount).toBe(2); // u1 and u2
      // Each pays 100k, total due = 200k
      expect(result.totalDue).toBe(200000);
      
      expect(mockSettlementsRepo.upsertByMonthAndUser).toHaveBeenCalledTimes(1);
    });

    it('should throw InvalidStateError if no attended records found', async () => {
      vi.mocked(mockSettlementsRepo.findByMonth).mockResolvedValueOnce([]); 
      mockListSessionsByMonth.mockResolvedValueOnce([{ id: 1 }]); 
      
      // Mock 0 attendees
      mockGetSessionAttendance.mockResolvedValueOnce([]);

      await expect(service.generateForMonth(1)).rejects.toThrow('Cannot generate settlements: no attended records found');
    });

    it('should handle repository exceptions in shuttlecock and event fetches by returning empty arrays', async () => {
      vi.mocked(mockSettlementsRepo.findByMonth).mockResolvedValueOnce([]); 
      mockListSessionsByMonth.mockResolvedValueOnce([{ id: 1, court_expense_amount: 200000 }]); 
      mockGetSessionAttendance.mockResolvedValueOnce([{ session_id: 1, user_id: 'u1', is_attended: true }]);
      
      // Inject failures into the imported mocks for this exact test
      const { createShuttlecocksRepository } = await import('@/modules/shuttlecocks/shuttlecocks.repository');
      const { createEventsRepository } = await import('@/modules/events/events.repository');
      
      vi.mocked(createShuttlecocksRepository).mockRejectedValueOnce(new Error('Crash'));
      vi.mocked(createEventsRepository).mockRejectedValueOnce(new Error('Crash'));

      vi.mocked(mockSettlementsRepo.upsertByMonthAndUser).mockResolvedValueOnce([{ id: 1, total_due: 0 } as any]);

      const result = await service.generateForMonth(1);
      expect(result.generatedCount).toBe(1);
    });

    it('should handle fetching event participants properly and filter false attendances', async () => {
      vi.mocked(mockSettlementsRepo.findByMonth).mockResolvedValueOnce([]); 
      mockListSessionsByMonth.mockResolvedValueOnce([{ id: 1, court_expense_amount: 200000 }]); 
      mockGetSessionAttendance.mockResolvedValueOnce([
        { session_id: 1, user_id: 'u1', is_attended: true },
        { session_id: 1, user_id: 'u2', is_attended: false },
      ]);
      
      const { createEventsRepository } = await import('@/modules/events/events.repository');
      const { createEventParticipantsRepository } = await import('@/modules/events/event-participants.repository');
      
      vi.mocked(createEventsRepository).mockResolvedValueOnce({
        supabase: {
          from: () => ({ select: () => ({ eq: vi.fn().mockResolvedValue({ data: [{ id: 1 }] }) }) })
        }
      } as any);
      
      vi.mocked(createEventParticipantsRepository).mockResolvedValueOnce({
        findByEvent: vi.fn().mockResolvedValueOnce([{ user_id: 'u1', contribution_per_person: 50000, is_paid: false }])
      } as any);
      
      vi.mocked(mockSettlementsRepo.upsertByMonthAndUser).mockResolvedValueOnce([{ id: 1, total_due: 0 } as any]);

      const result = await service.generateForMonth(1);
      expect(result.generatedCount).toBe(1);
    });
  });

  describe('listByMonth', () => {
    it('should validate monthId', async () => {
      await expect(service.listByMonth(-1)).rejects.toThrow('monthId must be a positive integer');
    });

    it('should return settlements', async () => {
      vi.mocked(mockSettlementsRepo.findByMonth).mockResolvedValueOnce([{ id: 1 } as any]);
      const res = await service.listByMonth(1);
      expect(res).toHaveLength(1);
    });
  });

  describe('listByMonthPaginated', () => {
    it('should validate monthId', async () => {
      await expect(service.listByMonthPaginated(-1)).rejects.toThrow('monthId must be a positive integer');
    });

    it('should throw ValidationError if status is invalid', async () => {
      await expect(service.listByMonthPaginated(1, { status: 'invalid' as any })).rejects.toThrow('status must be one of: all, paid, unpaid');
    });

    it('should throw ValidationError if sortBy is invalid', async () => {
      await expect(service.listByMonthPaginated(1, { sortBy: 'invalid' as any })).rejects.toThrow('sortBy is invalid');
    });

    it('should throw ValidationError if sortOrder is invalid', async () => {
      await expect(service.listByMonthPaginated(1, { sortOrder: 'invalid' as any })).rejects.toThrow('sortOrder must be asc or desc');
    });

    it('should paginate results normally', async () => {
      vi.mocked(mockSettlementsRepo.findByMonthPaginated).mockResolvedValueOnce({ items: [{ id: 1 } as any], total: 50 });
      const res = await service.listByMonthPaginated(1);
      expect(res.pagination.totalPages).toBe(3); // 50 / 20 = 2.5 => 3
    });
  });

  describe('getById', () => {
    it('should throw ValidationError if id invalid', async () => {
      await expect(service.getById(-1)).rejects.toThrow('Settlement ID is invalid');
    });

    it('should throw NotFoundError if null', async () => {
      vi.mocked(mockSettlementsRepo.findById).mockResolvedValueOnce(null as any);
      await expect(service.getById(1)).rejects.toThrow('Settlement not found');
    });
  });

  describe('createSettlementsService', () => {
    it('should initialize repos and return service', async () => {
      vi.mocked(settlementsRepoModule.createSettlementsRepository).mockResolvedValueOnce(mockSettlementsRepo as any);
      const srv = await createSettlementsService();
      expect(srv).toBeInstanceOf(SettlementsService);
      expect(settlementsRepoModule.createSettlementsRepository).toHaveBeenCalled();
    });
  });
});
