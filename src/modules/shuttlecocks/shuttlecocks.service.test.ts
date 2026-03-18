import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShuttlecocksService, createShuttlecocksService } from './shuttlecocks.service';
import { ShuttlecocksRepository } from './shuttlecocks.repository';
import * as shuttlecocksRepoModule from './shuttlecocks.repository';
import { ValidationError, NotFoundError } from '@/shared/api';

const mockShuttlecocksRepo = {
  findByMonthWithBuyer: vi.fn(),
  findById: vi.fn(),
  createDetail: vi.fn(),
  updateDetail: vi.fn(),
  deleteDetail: vi.fn(),
} as unknown as ShuttlecocksRepository;

vi.mock('./shuttlecocks.repository', () => ({
  createShuttlecocksRepository: vi.fn(),
}));

describe('ShuttlecocksService', () => {
  let service: ShuttlecocksService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ShuttlecocksService(mockShuttlecocksRepo);
  });

  describe('listByMonth', () => {
    it('should throw ValidationError if monthId is invalid', async () => {
      await expect(service.listByMonth(-1)).rejects.toThrow(ValidationError);
      await expect(service.listByMonth(0)).rejects.toThrow(ValidationError);
      await expect(service.listByMonth(1.5)).rejects.toThrow(ValidationError);
    });

    it('should call repository if monthId is valid', async () => {
      vi.mocked(mockShuttlecocksRepo.findByMonthWithBuyer).mockResolvedValueOnce([{ id: 1 }] as any);
      const result = await service.listByMonth(1);
      expect(mockShuttlecocksRepo.findByMonthWithBuyer).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('should throw ValidationError if id is invalid', async () => {
      await expect(service.getById(-1)).rejects.toThrow(ValidationError);
      await expect(service.getById(0)).rejects.toThrow(ValidationError);
      await expect(service.getById(1.5)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if repository throws', async () => {
      vi.mocked(mockShuttlecocksRepo.findById).mockRejectedValueOnce(new Error('DB Error'));
      await expect(service.getById(1)).rejects.toThrow(NotFoundError);
    });

    it('should successfully return the record', async () => {
      vi.mocked(mockShuttlecocksRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      const result = await service.getById(1);
      expect(result.id).toBe(1);
    });
  });

  describe('createDetail', () => {
    const validData = {
      month_id: 1,
      purchase_date: '2023-10-01',
      quantity: 5,
      unit_price: 150000,
      buyer_user_id: 'u1',
    };

    it('should throw ValidationError if purchase_date is invalid', async () => {
      await expect(service.createDetail({ ...validData, purchase_date: '2023/10/01' })).rejects.toThrow('purchase_date must be in format YYYY-MM-DD');
    });

    it('should throw ValidationError if quantity is invalid', async () => {
      await expect(service.createDetail({ ...validData, quantity: 0 })).rejects.toThrow('quantity must be a positive integer');
      await expect(service.createDetail({ ...validData, quantity: 1.5 })).rejects.toThrow('quantity must be a positive integer');
    });

    it('should throw ValidationError if unit_price is invalid', async () => {
      await expect(service.createDetail({ ...validData, unit_price: 0 })).rejects.toThrow('unit_price must be greater than 0');
    });

    it('should throw ValidationError if buyer_user_id is empty', async () => {
      await expect(service.createDetail({ ...validData, buyer_user_id: '' })).rejects.toThrow('buyer_user_id is required');
    });

    it('should successfully create record', async () => {
      vi.mocked(mockShuttlecocksRepo.createDetail).mockResolvedValueOnce({ id: 1 } as any);
      const result = await service.createDetail(validData);
      expect(mockShuttlecocksRepo.createDetail).toHaveBeenCalledWith(validData);
      expect(result.id).toBe(1);
    });
  });

  describe('updateDetail', () => {
    beforeEach(() => {
      vi.mocked(mockShuttlecocksRepo.findById).mockResolvedValue({ id: 1 } as any);
    });

    it('should throw NotFoundError if record does not exist', async () => {
      vi.mocked(mockShuttlecocksRepo.findById).mockRejectedValueOnce(new Error('DB Error'));
      await expect(service.updateDetail(1, {})).rejects.toThrow(NotFoundError);
    });

    it('should validate partial date update', async () => {
      await expect(service.updateDetail(1, { purchase_date: 'INVALID' })).rejects.toThrow('purchase_date must be in format YYYY-MM-DD');
    });

    it('should validate partial quantity update', async () => {
      await expect(service.updateDetail(1, { quantity: 0 })).rejects.toThrow('quantity must be a positive integer');
    });

    it('should validate partial unit_price update', async () => {
      await expect(service.updateDetail(1, { unit_price: -5 })).rejects.toThrow('unit_price must be greater than 0');
    });

    it('should successfully update valid data', async () => {
      vi.mocked(mockShuttlecocksRepo.updateDetail).mockResolvedValueOnce({ id: 1, quantity: 10 } as any);
      const result = await service.updateDetail(1, { quantity: 10 });
      expect(mockShuttlecocksRepo.updateDetail).toHaveBeenCalledWith(1, { quantity: 10 });
      expect(result.quantity).toBe(10);
    });
  });

  describe('deleteDetail', () => {
    it('should throw NotFoundError if record does not exist', async () => {
      vi.mocked(mockShuttlecocksRepo.findById).mockRejectedValueOnce(new Error('DB Error'));
      await expect(service.deleteDetail(1)).rejects.toThrow(NotFoundError);
    });

    it('should successfully delete record', async () => {
      vi.mocked(mockShuttlecocksRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockShuttlecocksRepo.deleteDetail).mockResolvedValueOnce(true);
      const result = await service.deleteDetail(1);
      expect(mockShuttlecocksRepo.deleteDetail).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('createShuttlecocksService', () => {
    it('should initialize repository and return instance', async () => {
      vi.mocked(shuttlecocksRepoModule.createShuttlecocksRepository).mockResolvedValueOnce(mockShuttlecocksRepo as any);
      const srv = await createShuttlecocksService();
      expect(srv).toBeInstanceOf(ShuttlecocksService);
      expect(shuttlecocksRepoModule.createShuttlecocksRepository).toHaveBeenCalled();
    });
  });
});
