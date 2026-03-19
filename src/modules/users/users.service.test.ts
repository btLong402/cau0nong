import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService, createUsersService } from './users.service';
import { UsersRepository } from './users.repository';
import * as usersRepositoryModule from './users.repository';

// Mock dependencies
const mockUsersRepo = {
  findAll: vi.fn(),
  countActive: vi.fn(),
  countByApprovalStatus: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByPhone: vi.fn(),
  findByUsername: vi.fn(),
  updateProfile: vi.fn(),
  deactivate: vi.fn(),
  reactivate: vi.fn(),
  updateApprovalStatus: vi.fn(),
  findByRole: vi.fn(),
  updateBalance: vi.fn(),
  count: vi.fn(),
  searchUsers: vi.fn(),
} as unknown as UsersRepository;

vi.mock('./users.repository', () => ({
  createUsersRepository: vi.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(mockUsersRepo);
  });

  describe('listMembers', () => {
    it('should correctly calculate pagination offset and hasMore (true)', async () => {
      vi.mocked(mockUsersRepo.findAll).mockResolvedValueOnce([{ id: 1 }, { id: 2 }] as any);
      vi.mocked(mockUsersRepo.count).mockResolvedValueOnce(5);

      // Page 1, Limit 2 => Offset 0, hasMore = true (0 + 2 < 5)
      const result = await service.listMembers(1, 2);
      
      expect(mockUsersRepo.findAll).toHaveBeenCalledWith(2, 0); // limit, offset
      expect(result.members).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it('should correctly calculate pagination offset and hasMore (false)', async () => {
      vi.mocked(mockUsersRepo.findAll).mockResolvedValueOnce([{ id: 3 }] as any);
      vi.mocked(mockUsersRepo.count).mockResolvedValueOnce(3);

      // Page 2, Limit 2 => Offset 2, hasMore = false (2 + 2 >= 3)
      const result = await service.listMembers(2, 2);
      
      expect(mockUsersRepo.findAll).toHaveBeenCalledWith(2, 2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getMember', () => {
    it('should throw NotFoundError if member does not exist', async () => {
      vi.mocked(mockUsersRepo.findById).mockResolvedValueOnce(null as any);
      await expect(service.getMember('u1')).rejects.toThrow('Member not found');
    });

    it('should return member if exists', async () => {
      vi.mocked(mockUsersRepo.findById).mockResolvedValueOnce({ id: 'u1' } as any);
      const result = await service.getMember('u1');
      expect(result.id).toBe('u1');
    });
  });

  describe('getMemberByEmail', () => {
    it('should return member by email', async () => {
      vi.mocked(mockUsersRepo.findByEmail).mockResolvedValueOnce({ id: 'u1' } as any);
      const result = await service.getMemberByEmail('test@test.com');
      expect(result?.id).toBe('u1');
    });
  });

  describe('getMemberByPhone', () => {
    it('should return member by phone', async () => {
      vi.mocked(mockUsersRepo.findByPhone).mockResolvedValueOnce({ id: 'u1' } as any);
      const result = await service.getMemberByPhone('0123456789');
      expect(result?.id).toBe('u1');
    });
  });

  describe('updateMember', () => {
    const existingUser = {
      id: 'u1',
      name: 'Old Name',
      email: 'old@test.com',
      phone: '0123456789',
    };

    beforeEach(() => {
      vi.mocked(mockUsersRepo.findById).mockResolvedValue(existingUser as any);
    });

    it('should throw Error if new email is already in use by someone else', async () => {
      vi.mocked(mockUsersRepo.findByEmail).mockResolvedValueOnce({ id: 'u2' } as any);

      await expect(
        service.updateMember('u1', { email: 'new@test.com' })
      ).rejects.toThrow('Email already in use');
    });

    it('should throw Error if new phone is already in use', async () => {
      vi.mocked(mockUsersRepo.findByEmail).mockResolvedValueOnce(null); // Valid email
      vi.mocked(mockUsersRepo.findByPhone).mockResolvedValueOnce({ id: 'u2' } as any);

      await expect(
        service.updateMember('u1', { phone: '0987654321' })
      ).rejects.toThrow('Phone already in use');
    });

    it('should successfully update member with fallback to old values', async () => {
      vi.mocked(mockUsersRepo.findByEmail).mockResolvedValueOnce(null as any);
      vi.mocked(mockUsersRepo.updateProfile).mockResolvedValueOnce({ id: 'u1', name: 'New Name' } as any);

      await service.updateMember('u1', { name: 'New Name', email: 'new@test.com' });

      expect(mockUsersRepo.updateProfile).toHaveBeenCalledWith('u1', {
        name: 'New Name',
        email: 'new@test.com',
        phone: '0123456789', // Kept from old
      });
    });

    it('should successfully update phone and bypass unique checks if valid', async () => {
      vi.mocked(mockUsersRepo.findByEmail).mockResolvedValueOnce(null as any);
      vi.mocked(mockUsersRepo.findByPhone).mockResolvedValueOnce(null as any);
      vi.mocked(mockUsersRepo.updateProfile).mockResolvedValueOnce({ id: 'u1' } as any);
      
      await service.updateMember('u1', { phone: '09876543210' });
      expect(mockUsersRepo.updateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ phone: '09876543210' }));
    });
  });

  describe('deactivateMember & reactivateMember', () => {
    it('deactivateMember should verify member exists and deactivate', async () => {
      vi.mocked(mockUsersRepo.findById).mockResolvedValueOnce({ id: 'u1' } as any);
      vi.mocked(mockUsersRepo.deactivate).mockResolvedValueOnce({ id: 'u1', is_active: false } as any);

      const result = await service.deactivateMember('u1');
      expect(mockUsersRepo.deactivate).toHaveBeenCalledWith('u1');
      expect(result.is_active).toBe(false);
    });

    it('reactivateMember should reactivate profile directly', async () => {
      vi.mocked(mockUsersRepo.reactivate).mockResolvedValueOnce({ id: 'u1', is_active: true } as any);
      const result = await service.reactivateMember('u1');
      expect(mockUsersRepo.reactivate).toHaveBeenCalledWith('u1');
      expect(result.is_active).toBe(true);
    });
  });

  describe('getMembersByRole', () => {
    it('should return members with specific role', async () => {
      vi.mocked(mockUsersRepo.findByRole).mockResolvedValueOnce([{ id: 'admin1' }] as any);
      const result = await service.getMembersByRole('admin');
      expect(mockUsersRepo.findByRole).toHaveBeenCalledWith('admin');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateBalance', () => {
    it('should update user balance directly', async () => {
      vi.mocked(mockUsersRepo.updateBalance).mockResolvedValueOnce({ id: 'u1', balance: 50000 } as any);
      const result = await service.updateBalance('u1', 50000);
      expect(mockUsersRepo.updateBalance).toHaveBeenCalledWith('u1', 50000);
      expect(result.balance).toBe(50000);
    });
  });

  describe('getStats', () => {
    it('should correctly fetch and compile user statistics', async () => {
      vi.mocked(mockUsersRepo.count).mockResolvedValueOnce(10);
      vi.mocked(mockUsersRepo.countActive).mockResolvedValueOnce(8);
      vi.mocked(mockUsersRepo.findByRole).mockResolvedValueOnce([{ id: 'a1' }, { id: 'a2' }] as any);
      vi.mocked(mockUsersRepo.countByApprovalStatus).mockResolvedValueOnce(2);

      const result = await service.getStats();

      expect(result.totalMembers).toBe(10);
      expect(result.activeMembers).toBe(8);
      expect(result.admins).toBe(2);
      expect(result.pendingApprovals).toBe(2);
    });
  });

  describe('searchUsers', () => {
    it('should search users by keyword', async () => {
      vi.mocked(mockUsersRepo.searchUsers).mockResolvedValueOnce([{ id: 'u1' }] as any);
      const result = await service.searchUsers('keyword');
      expect(mockUsersRepo.searchUsers).toHaveBeenCalledWith('keyword');
      expect(result).toHaveLength(1);
    });
  });

  describe('createUsersService', () => {
    it('should initialize repository and return service instance', async () => {
      vi.mocked(usersRepositoryModule.createUsersRepository).mockResolvedValueOnce(mockUsersRepo as any);
      const srv = await createUsersService();
      expect(srv).toBeInstanceOf(UsersService);
      expect(usersRepositoryModule.createUsersRepository).toHaveBeenCalled();
    });
  });
});
