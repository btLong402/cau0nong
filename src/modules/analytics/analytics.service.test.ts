import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService, createAnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import * as analyticsRepoModule from './analytics.repository';
import { ValidationError } from '@/shared/api';

const mockAnalyticsRepo = {
  getOverviewStats: vi.fn(),
  getAttendanceRanking: vi.fn(),
  getExpenseTrend: vi.fn(),
} as unknown as AnalyticsRepository;

vi.mock('./analytics.repository', () => ({
  createAnalyticsRepository: vi.fn(),
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AnalyticsService(mockAnalyticsRepo);
  });

  describe('getAnalytics', () => {
    it('should throw ValidationError if type is invalid', async () => {
      await expect(service.getAnalytics('invalid' as any)).rejects.toThrow(ValidationError);
    });

    it('should call getOverviewStats for overview type', async () => {
      vi.mocked(mockAnalyticsRepo.getOverviewStats).mockResolvedValueOnce({} as any);
      await service.getAnalytics('overview');
      expect(mockAnalyticsRepo.getOverviewStats).toHaveBeenCalled();
    });

    it('should call getAttendanceRanking for attendance type', async () => {
      vi.mocked(mockAnalyticsRepo.getAttendanceRanking).mockResolvedValueOnce([]);
      await service.getAnalytics('attendance');
      expect(mockAnalyticsRepo.getAttendanceRanking).toHaveBeenCalled();
    });

    it('should call getExpenseTrend for expense type', async () => {
      vi.mocked(mockAnalyticsRepo.getExpenseTrend).mockResolvedValueOnce([]);
      await service.getAnalytics('expense');
      expect(mockAnalyticsRepo.getExpenseTrend).toHaveBeenCalled();
    });
  });

  describe('createAnalyticsService', () => {
    it('should initialize repository and return instance', async () => {
      vi.mocked(analyticsRepoModule.createAnalyticsRepository).mockResolvedValueOnce(mockAnalyticsRepo as any);
      const srv = await createAnalyticsService();
      expect(srv).toBeInstanceOf(AnalyticsService);
      expect(analyticsRepoModule.createAnalyticsRepository).toHaveBeenCalled();
    });
  });
});
