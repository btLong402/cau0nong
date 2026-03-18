import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentsService, createPaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import * as paymentsRepoModule from './payments.repository';
import * as monthsServiceModule from '@/modules/months/months.service';
import * as settlementsServiceModule from '@/modules/settlements/settlements.service';
import { ValidationError, InvalidStateError } from '@/shared/api';

const mockPaymentsRepo = {
  findLatestBySettlement: vi.fn(),
  createVietQRPayment: vi.fn(),
  listByMonth: vi.fn(),
} as unknown as PaymentsRepository;

vi.mock('./payments.repository', () => ({
  createPaymentsRepository: vi.fn(),
}));

const mockMonthsService = {
  getMonth: vi.fn(),
};

const mockSettlementsService = {
  getById: vi.fn(),
};

vi.mock('@/modules/months/months.service', () => ({
  createMonthsService: vi.fn(() => Promise.resolve(mockMonthsService)),
}));

vi.mock('@/modules/settlements/settlements.service', () => ({
  createSettlementsService: vi.fn(() => Promise.resolve(mockSettlementsService)),
}));

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentsService(mockPaymentsRepo);
    process.env.VIETQR_BANK_BIN = '123456';
    process.env.VIETQR_ACCOUNT_NO = '987654';
    process.env.VIETQR_ACCOUNT_NAME = 'TEST ACC';
    process.env.VIETQR_TEMPLATE = 'qronly';
  });

  describe('createOrReuseSettlementVietQR', () => {
    it('should throw ValidationError if settlementId is invalid', async () => {
      await expect(service.createOrReuseSettlementVietQR(-1)).rejects.toThrow(ValidationError);
      await expect(service.createOrReuseSettlementVietQR(0)).rejects.toThrow(ValidationError);
      await expect(service.createOrReuseSettlementVietQR(1.5)).rejects.toThrow(ValidationError);
    });

    it('should throw InvalidStateError if settlement is already paid', async () => {
      mockSettlementsService.getById.mockResolvedValueOnce({ is_paid: true });
      await expect(service.createOrReuseSettlementVietQR(1)).rejects.toThrow(InvalidStateError);
    });

    it('should create new VietQR payment if none exists', async () => {
      mockSettlementsService.getById.mockResolvedValueOnce({
        id: 1,
        month_id: 2,
        user_id: 'u1',
        total_due: 150000,
        is_paid: false,
      });
      mockMonthsService.getMonth.mockResolvedValueOnce({ month_year: '2023-10-01' });
      vi.mocked(mockPaymentsRepo.findLatestBySettlement).mockResolvedValueOnce(null);
      vi.mocked(mockPaymentsRepo.createVietQRPayment).mockResolvedValueOnce({ id: 99 } as any);

      const result = await service.createOrReuseSettlementVietQR(1);

      expect(mockPaymentsRepo.createVietQRPayment).toHaveBeenCalled();
      expect(result.payment.id).toBe(99);
      expect(result.payload.amount).toBe(150000);
      expect(result.payload.addInfo).toBe('CLB CAU LONG 2023-10 U1');
    });

    it('should create new VietQR payment if existing QR content is outdated', async () => {
      mockSettlementsService.getById.mockResolvedValueOnce({
        id: 1,
        month_id: 2,
        user_id: 'u1',
        total_due: 150000, // New amount
        is_paid: false,
      });
      mockMonthsService.getMonth.mockResolvedValueOnce({ month_year: '2023-10-01' });
      vi.mocked(mockPaymentsRepo.findLatestBySettlement).mockResolvedValueOnce({
        id: 88,
        qr_content: 'old-content',
      } as any);
      vi.mocked(mockPaymentsRepo.createVietQRPayment).mockResolvedValueOnce({ id: 99 } as any);

      const result = await service.createOrReuseSettlementVietQR(1);

      expect(mockPaymentsRepo.createVietQRPayment).toHaveBeenCalled();
      expect(result.payment.id).toBe(99);
    });

    it('should reuse existing VietQR payment if QR content matches exactly', async () => {
      mockSettlementsService.getById.mockResolvedValueOnce({
        id: 1,
        month_id: 2,
        user_id: 'u1',
        total_due: 150000,
        is_paid: false,
      });
      mockMonthsService.getMonth.mockResolvedValueOnce({ month_year: '2023-10-01' });
      
      const expectedContent = 'vietqr://pay?bankBin=123456&accountNo=987654&amount=150000&addInfo=CLB+CAU+LONG+2023-10+U1&accountName=TEST+ACC&template=qronly';

      vi.mocked(mockPaymentsRepo.findLatestBySettlement).mockResolvedValueOnce({
        id: 88,
        qr_content: expectedContent,
      } as any);

      const result = await service.createOrReuseSettlementVietQR(1);

      expect(mockPaymentsRepo.createVietQRPayment).not.toHaveBeenCalled();
      expect(result.payment.id).toBe(88);
    });

    it('should fallback to default env variables if unset', async () => {
      delete process.env.VIETQR_BANK_BIN;
      delete process.env.VIETQR_ACCOUNT_NO;
      delete process.env.VIETQR_ACCOUNT_NAME;
      delete process.env.VIETQR_TEMPLATE;

      mockSettlementsService.getById.mockResolvedValueOnce({
        id: 1, month_id: 2, user_id: 'u1', total_due: 150000, is_paid: false,
      });
      mockMonthsService.getMonth.mockResolvedValueOnce({ month_year: '2023-10-01' });
      vi.mocked(mockPaymentsRepo.findLatestBySettlement).mockResolvedValueOnce(null);
      vi.mocked(mockPaymentsRepo.createVietQRPayment).mockResolvedValueOnce({ id: 99 } as any);

      const result = await service.createOrReuseSettlementVietQR(1);
      
      expect(result.payload.bankBin).toBe('970436');
      expect(result.payload.accountNo).toBe('0000000000');
      expect(result.payload.accountName).toBe('CLB CAU LONG');
      expect(result.payload.template).toBe('compact2');
      
      // restore after test
      process.env.VIETQR_BANK_BIN = '123456';
      process.env.VIETQR_ACCOUNT_NO = '987654';
      process.env.VIETQR_ACCOUNT_NAME = 'TEST ACC';
      process.env.VIETQR_TEMPLATE = 'qronly';
    });
  });

  describe('listByMonth', () => {
    it('should throw ValidationError if monthId is invalid', async () => {
      await expect(service.listByMonth(-1)).rejects.toThrow(ValidationError);
      await expect(service.listByMonth(0)).rejects.toThrow(ValidationError);
      await expect(service.listByMonth(1.5)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if status is invalid', async () => {
      await expect(service.listByMonth(1, { status: 'invalid' as any })).rejects.toThrow(ValidationError);
    });

    it('should list payments with normalized pagination variables', async () => {
      vi.mocked(mockPaymentsRepo.listByMonth).mockResolvedValueOnce({
        items: [{ id: 1 } as any],
        total: 50,
      });

      const result = await service.listByMonth(1, { page: 2, limit: 15, search: ' test ', status: 'paid' });

      expect(mockPaymentsRepo.listByMonth).toHaveBeenCalledWith(1, 2, 15, 'test', 'paid');
      expect(result.pagination.totalPages).toBe(4); // ceil(50/15)
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should fallback to defaults when filters are missing', async () => {
      vi.mocked(mockPaymentsRepo.listByMonth).mockResolvedValueOnce({
        items: [],
        total: 0,
      });

      const result = await service.listByMonth(1);
      expect(mockPaymentsRepo.listByMonth).toHaveBeenCalledWith(1, 1, 20, undefined, 'all');
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe('createPaymentsService', () => {
    it('should initialize repository and return instance', async () => {
      vi.mocked(paymentsRepoModule.createPaymentsRepository).mockResolvedValueOnce(mockPaymentsRepo as any);
      const srv = await createPaymentsService();
      expect(srv).toBeInstanceOf(PaymentsService);
      expect(paymentsRepoModule.createPaymentsRepository).toHaveBeenCalled();
    });
  });
});
