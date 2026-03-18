import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonthsService, createMonthsService } from './months.service';
import { MonthsRepository } from './months.repository';
import * as monthsRepositoryModule from './months.repository';

// Mock dependencies
const mockMonthsRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByMonthYear: vi.fn(),
  findByStatus: vi.fn(),
  findAllSorted: vi.fn(),
  findAllOpen: vi.fn(),
  updateStatus: vi.fn(),
  updateShuttlecockExpense: vi.fn(),
} as unknown as MonthsRepository;

vi.mock('./months.repository', () => ({
  createMonthsRepository: vi.fn(),
}));

describe('MonthsService', () => {
  let service: MonthsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MonthsService(mockMonthsRepo);
  });

  describe('createMonth', () => {
    it('should throw Error if date format is invalid', async () => {
      await expect(
        service.createMonth({ month_year: '2023-13' })
      ).rejects.toThrow('month_year must be in format YYYY-MM-01');
    });

    it('should throw ConflictError if month already exists', async () => {
      vi.mocked(mockMonthsRepo.findByMonthYear).mockResolvedValueOnce({ id: 1 } as any);
      await expect(
        service.createMonth({ month_year: '2023-10-01' })
      ).rejects.toThrow('Month 2023-10-01 already exists');
    });

    it('should create and return a new month defaulting to open', async () => {
      vi.mocked(mockMonthsRepo.findByMonthYear).mockResolvedValueOnce(null);
      vi.mocked(mockMonthsRepo.create).mockResolvedValueOnce({ id: 1, status: 'open' } as any);

      const result = await service.createMonth({ month_year: '2023-10-01' });

      expect(mockMonthsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          month_year: '2023-10-01',
          status: 'open',
          total_shuttlecock_expense: 0,
        })
      );
      expect(result.id).toBe(1);
    });

    it('should create with specific status if provided', async () => {
      vi.mocked(mockMonthsRepo.findByMonthYear).mockResolvedValueOnce(null);
      vi.mocked(mockMonthsRepo.create).mockResolvedValueOnce({ id: 2, status: 'closed' } as any);

      await service.createMonth({ month_year: '2023-11-01', status: 'closed' });

      expect(mockMonthsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'closed' })
      );
    });
  });

  describe('getMonth', () => {
    it('should throw NotFoundError if month does not exist', async () => {
      vi.mocked(mockMonthsRepo.findById).mockResolvedValueOnce(null as any);
      await expect(service.getMonth(1)).rejects.toThrow('Month not found');
    });

    it('should return month if exists', async () => {
      vi.mocked(mockMonthsRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      const result = await service.getMonth(1);
      expect(result.id).toBe(1);
    });
  });

  describe('listMonths', () => {
    it('should use findByStatus if status filter is provided', async () => {
      vi.mocked(mockMonthsRepo.findByStatus).mockResolvedValueOnce([{ id: 1 }] as any);
      const result = await service.listMonths({ status: 'open' });
      expect(mockMonthsRepo.findByStatus).toHaveBeenCalledWith('open');
      expect(result).toHaveLength(1);
    });

    it('should use findAllSorted if no filters provided', async () => {
      vi.mocked(mockMonthsRepo.findAllSorted).mockResolvedValueOnce([{ id: 1 }, { id: 2 }] as any);
      const result = await service.listMonths();
      expect(mockMonthsRepo.findAllSorted).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('listOpenMonths', () => {
    it('should call findAllOpen', async () => {
      vi.mocked(mockMonthsRepo.findAllOpen).mockResolvedValueOnce([{ id: 1 }] as any);
      const result = await service.listOpenMonths();
      expect(mockMonthsRepo.findAllOpen).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('closeMonth', () => {
    it('should throw Error if month is already closed', async () => {
      vi.mocked(mockMonthsRepo.findById).mockResolvedValueOnce({ id: 1, status: 'closed' } as any);
      await expect(service.closeMonth(1)).rejects.toThrow('Month is already closed');
    });

    it('should update status to closed', async () => {
      vi.mocked(mockMonthsRepo.findById).mockResolvedValueOnce({ id: 1, status: 'open' } as any);
      vi.mocked(mockMonthsRepo.updateStatus).mockResolvedValueOnce({ id: 1, status: 'closed' } as any);
      const result = await service.closeMonth(1);
      expect(mockMonthsRepo.updateStatus).toHaveBeenCalledWith(1, 'closed');
      expect(result.status).toBe('closed');
    });
  });

  describe('reopenMonth', () => {
    it('should throw Error if month is already open', async () => {
      vi.mocked(mockMonthsRepo.findById).mockResolvedValueOnce({ id: 1, status: 'open' } as any);
      await expect(service.reopenMonth(1)).rejects.toThrow('Month is already open');
    });

    it('should update status to open', async () => {
      vi.mocked(mockMonthsRepo.findById).mockResolvedValueOnce({ id: 1, status: 'closed' } as any);
      vi.mocked(mockMonthsRepo.updateStatus).mockResolvedValueOnce({ id: 1, status: 'open' } as any);
      const result = await service.reopenMonth(1);
      expect(mockMonthsRepo.updateStatus).toHaveBeenCalledWith(1, 'open');
      expect(result.status).toBe('open');
    });
  });

  describe('getCurrentMonth', () => {
    it('should return null if no open months', async () => {
      vi.mocked(mockMonthsRepo.findAllOpen).mockResolvedValueOnce([]);
      const result = await service.getCurrentMonth();
      expect(result).toBeNull();
    });

    it('should return the most recent open month', async () => {
      vi.mocked(mockMonthsRepo.findAllOpen).mockResolvedValueOnce([
        { id: 1, month_year: '2023-09-01' },
        { id: 2, month_year: '2023-11-01' }, // Most recent
        { id: 3, month_year: '2023-10-01' },
      ] as any);
      
      const result = await service.getCurrentMonth();
      expect(result!.id).toBe(2);
    });
  });

  describe('updateShuttlecockExpense', () => {
    it('should verify month exists before updating expense', async () => {
      vi.mocked(mockMonthsRepo.findById).mockResolvedValueOnce(null as any);
      await expect(service.updateShuttlecockExpense(1, 500000)).rejects.toThrow('Month not found');
      expect(mockMonthsRepo.updateShuttlecockExpense).not.toHaveBeenCalled();
    });

    it('should update shuttlecock expense successfully', async () => {
      vi.mocked(mockMonthsRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockMonthsRepo.updateShuttlecockExpense).mockResolvedValueOnce({ id: 1, total_shuttlecock_expense: 500000 } as any);
      
      const result = await service.updateShuttlecockExpense(1, 500000);
      expect(mockMonthsRepo.updateShuttlecockExpense).toHaveBeenCalledWith(1, 500000);
      expect(result.total_shuttlecock_expense).toBe(500000);
    });
  });

  describe('createMonthsService', () => {
    it('should initialize repository and return service instance', async () => {
      vi.mocked(monthsRepositoryModule.createMonthsRepository).mockResolvedValueOnce(mockMonthsRepo as any);
      const srv = await createMonthsService();
      expect(srv).toBeInstanceOf(MonthsService);
      expect(monthsRepositoryModule.createMonthsRepository).toHaveBeenCalled();
    });
  });
});
