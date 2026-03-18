import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventsService, createEventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { EventParticipantsRepository } from './event-participants.repository';
import * as eventsRepoModule from './events.repository';
import * as participantsRepoModule from './event-participants.repository';

const mockEventsRepo = {
  findPaginated: vi.fn(),
  findEventById: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
} as unknown as EventsRepository;

const mockParticipantsRepo = {
  findByEventWithUsers: vi.fn(),
  findByEvent: vi.fn(),
  countByEvent: vi.fn(),
  bulkAdd: vi.fn(),
  removeParticipant: vi.fn(),
  updateContributions: vi.fn(),
  markPaid: vi.fn(),
} as unknown as EventParticipantsRepository;

vi.mock('./events.repository', () => ({
  createEventsRepository: vi.fn(),
}));

vi.mock('./event-participants.repository', () => ({
  createEventParticipantsRepository: vi.fn(),
}));

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EventsService(mockEventsRepo, mockParticipantsRepo);
  });

  describe('listEvents', () => {
    it('should normalize filters and return paginated result', async () => {
      vi.mocked(mockEventsRepo.findPaginated).mockResolvedValueOnce({
        items: [{ id: 1 } as any],
        total: 25,
      });

      const result = await service.listEvents({ page: 2, limit: 10, search: ' test ' });

      expect(mockEventsRepo.findPaginated).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        sortBy: 'event_date',
        sortOrder: 'desc',
        search: 'test',
      });
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should throw ValidationError if sortBy is invalid', async () => {
      await expect(service.listEvents({ sortBy: 'invalid' as any })).rejects.toThrow('Invalid sortBy field');
    });

    it('should throw ValidationError if sortOrder is invalid', async () => {
      await expect(service.listEvents({ sortOrder: 'invalid' as any })).rejects.toThrow('sortOrder must be asc or desc');
    });
  });

  describe('getEventWithParticipants', () => {
    it('should throw NotFoundError if event does not exist', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce(null);
      await expect(service.getEventWithParticipants(1)).rejects.toThrow('Event not found');
    });

    it('should map event and calculate is_settled based on contributions', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockParticipantsRepo.findByEventWithUsers).mockResolvedValueOnce([
        { id: 1, contribution_per_person: 50 },
        { id: 2, contribution_per_person: 50 },
      ] as any);

      const result = await service.getEventWithParticipants(1);
      
      expect(result.participant_count).toBe(2);
      expect(result.is_settled).toBe(true); // all contributions > 0
    });

    it('should set is_settled to false if a participant has 0 contribution', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockParticipantsRepo.findByEventWithUsers).mockResolvedValueOnce([
        { id: 1, contribution_per_person: 0 },
      ] as any);

      const result = await service.getEventWithParticipants(1);
      expect(result.is_settled).toBe(false);
    });

    it('should set is_settled to false if no participants', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockParticipantsRepo.findByEventWithUsers).mockResolvedValueOnce([]);

      const result = await service.getEventWithParticipants(1);
      expect(result.is_settled).toBe(false);
    });
  });

  describe('createEvent', () => {
    const validData = {
      event_name: 'Tournament',
      event_date: '2023-10-01',
      total_expense: 1000,
      total_support: 500,
    };

    it('should successfully validate and create an event', async () => {
      vi.mocked(mockEventsRepo.createEvent).mockResolvedValueOnce({ id: 1 } as any);
      const result = await service.createEvent(validData);
      expect(mockEventsRepo.createEvent).toHaveBeenCalledWith(validData);
      expect(result.id).toBe(1);
    });

    it('should throw ValidationError if name is too short', async () => {
      await expect(service.createEvent({ ...validData, event_name: 'A' })).rejects.toThrow('event_name must be 2-200 characters');
    });
    
    it('should throw ValidationError if name is too long', async () => {
      await expect(service.createEvent({ ...validData, event_name: 'A'.repeat(201) })).rejects.toThrow('event_name must be 2-200 characters');
    });

    it('should throw ValidationError if date is invalid format', async () => {
      await expect(service.createEvent({ ...validData, event_date: '2023/10/01' })).rejects.toThrow('event_date must be in format YYYY-MM-DD');
    });

    it('should throw ValidationError if expense is negative', async () => {
      await expect(service.createEvent({ ...validData, total_expense: -1 })).rejects.toThrow('total_expense must be >= 0');
    });

    it('should throw ValidationError if support is negative', async () => {
      await expect(service.createEvent({ ...validData, total_support: -1 })).rejects.toThrow('total_support must be >= 0');
    });
  });

  describe('updateEvent', () => {
    beforeEach(() => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValue({ id: 1 } as any);
    });

    it('should throw NotFoundError if event does not exist', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce(null);
      await expect(service.updateEvent(1, {})).rejects.toThrow('Event not found');
    });

    it('should validate partial name updates', async () => {
      await expect(service.updateEvent(1, { event_name: 'A' })).rejects.toThrow('event_name must be 2-200 characters');
      await expect(service.updateEvent(1, { event_name: 'A'.repeat(201) })).rejects.toThrow('event_name must be 2-200 characters');
    });

    it('should validate partial date updates', async () => {
      await expect(service.updateEvent(1, { event_date: '2023/10/01' })).rejects.toThrow('event_date must be in format YYYY-MM-DD');
    });

    it('should successfully update valid name', async () => {
      await service.updateEvent(1, { event_name: 'Valid Name' });
      expect(mockEventsRepo.updateEvent).toHaveBeenCalledWith(1, { event_name: 'Valid Name' });
    });

    it('should successfully update valid data', async () => {
      await service.updateEvent(1, { total_expense: 5000 });
      expect(mockEventsRepo.updateEvent).toHaveBeenCalledWith(1, { total_expense: 5000 });
    });
  });

  describe('deleteEvent', () => {
    it('should throw NotFoundError if event does not exist', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce(null);
      await expect(service.deleteEvent(1)).rejects.toThrow('Event not found');
    });

    it('should throw InvalidStateError if any participant has already paid', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockParticipantsRepo.findByEvent).mockResolvedValueOnce([{ is_paid: true }] as any);
      
      await expect(service.deleteEvent(1)).rejects.toThrow('Cannot delete event with paid participants');
    });

    it('should successfully delete if no paid participants', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockParticipantsRepo.findByEvent).mockResolvedValueOnce([{ is_paid: false }] as any);
      
      await service.deleteEvent(1);
      expect(mockEventsRepo.deleteEvent).toHaveBeenCalledWith(1);
    });
  });

  describe('addParticipants', () => {
    it('should throw NotFoundError if event does not exist', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce(null);
      await expect(service.addParticipants(1, ['u1'])).rejects.toThrow('Event not found');
    });

    it('should throw ValidationError if userIds array is empty', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      await expect(service.addParticipants(1, [])).rejects.toThrow('At least one userId is required');
    });

    it('should bulk add participants', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      await service.addParticipants(1, ['u1', 'u2']);
      expect(mockParticipantsRepo.bulkAdd).toHaveBeenCalledWith(1, ['u1', 'u2']);
    });
  });

  describe('removeParticipant', () => {
    it('should throw NotFoundError if participant does not exist', async () => {
      vi.mocked(mockParticipantsRepo.findByEvent).mockResolvedValueOnce([]);
      await expect(service.removeParticipant(1, 'u1')).rejects.toThrow('Participant not found');
    });

    it('should throw InvalidStateError if participant is already paid', async () => {
      vi.mocked(mockParticipantsRepo.findByEvent).mockResolvedValueOnce([{ user_id: 'u1', is_paid: true }] as any);
      await expect(service.removeParticipant(1, 'u1')).rejects.toThrow('Cannot remove a paid participant');
    });

    it('should remove participant successfully', async () => {
      vi.mocked(mockParticipantsRepo.findByEvent).mockResolvedValueOnce([{ user_id: 'u1', is_paid: false }] as any);
      await service.removeParticipant(1, 'u1');
      expect(mockParticipantsRepo.removeParticipant).toHaveBeenCalledWith(1, 'u1');
    });
  });

  describe('settleEvent', () => {
    it('should throw NotFoundError if event does not exist', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce(null);
      await expect(service.settleEvent(1)).rejects.toThrow('Event not found');
    });

    it('should throw InvalidStateError if no participants', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockParticipantsRepo.countByEvent).mockResolvedValueOnce(0);
      await expect(service.settleEvent(1)).rejects.toThrow('Cannot settle event with no participants');
    });

    it('should calculate and update contributions', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1, total_expense: 1000, total_support: 500 } as any);
      vi.mocked(mockParticipantsRepo.countByEvent).mockResolvedValueOnce(2);
      vi.mocked(mockParticipantsRepo.updateContributions).mockResolvedValueOnce([1, 2] as any); // Returns 2 updated records

      const result = await service.settleEvent(1);
      
      // Expected contribution = (1000 - 500) / 2 = 250
      expect(mockParticipantsRepo.updateContributions).toHaveBeenCalledWith(1, 250);
      expect(result.contribution_per_person).toBe(250);
      expect(result.updated_count).toBe(2);
      expect(result.deficit).toBe(500);
    });
  });

  describe('markParticipantPaid', () => {
    it('should throw NotFoundError if event does not exist', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce(null);
      await expect(service.markParticipantPaid(1, 'u1')).rejects.toThrow('Event not found');
    });

    it('should throw NotFoundError if participant does not exist in event', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockParticipantsRepo.findByEvent).mockResolvedValueOnce([]);
      await expect(service.markParticipantPaid(1, 'u1')).rejects.toThrow('Participant not found');
    });

    it('should throw ConflictError if participant is already paid', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockParticipantsRepo.findByEvent).mockResolvedValueOnce([{ user_id: 'u1', is_paid: true }] as any);
      await expect(service.markParticipantPaid(1, 'u1')).rejects.toThrow('Participant is already marked as paid');
    });

    it('should mark participant as paid successfully', async () => {
      vi.mocked(mockEventsRepo.findEventById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockParticipantsRepo.findByEvent).mockResolvedValueOnce([{ user_id: 'u1', is_paid: false }] as any);
      
      await service.markParticipantPaid(1, 'u1');
      expect(mockParticipantsRepo.markPaid).toHaveBeenCalledWith(1, 'u1');
    });
  });

  describe('createEventsService', () => {
    it('should initialize repositories and return service instance', async () => {
      vi.mocked(eventsRepoModule.createEventsRepository).mockResolvedValueOnce(mockEventsRepo as any);
      vi.mocked(participantsRepoModule.createEventParticipantsRepository).mockResolvedValueOnce(mockParticipantsRepo as any);
      
      const srv = await createEventsService();
      
      expect(srv).toBeInstanceOf(EventsService);
      expect(eventsRepoModule.createEventsRepository).toHaveBeenCalled();
      expect(participantsRepoModule.createEventParticipantsRepository).toHaveBeenCalled();
    });
  });
});
