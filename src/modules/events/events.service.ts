/**
 * Events Service
 * Business logic for event management and settlement
 */

import { calculateEventContributionPerPerson } from "@/lib/calculations";
import {
  ConflictError,
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from "@/shared/api";
import {
  EventsRepository,
  createEventsRepository,
} from "./events.repository";
import {
  EventParticipantsRepository,
  createEventParticipantsRepository,
} from "./event-participants.repository";
import type {
  CreateEventData,
  UpdateEventData,
  EventWithParticipants,
  EventListFilters,
  EventListResult,
} from "./types";
import {
  EVENT_NAME_MAX_LENGTH,
  EVENT_NAME_MIN_LENGTH,
  EVENT_DEFAULTS,
  VALID_SORT_FIELDS,
  VALID_SORT_ORDERS,
} from "./constants";

function validateEventData(data: CreateEventData) {
  if (
    !data.event_name ||
    data.event_name.length < EVENT_NAME_MIN_LENGTH ||
    data.event_name.length > EVENT_NAME_MAX_LENGTH
  ) {
    throw new ValidationError(
      `event_name must be ${EVENT_NAME_MIN_LENGTH}-${EVENT_NAME_MAX_LENGTH} characters`
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.event_date)) {
    throw new ValidationError("event_date phải có định dạng YYYY-MM-DD");
  }

  if (data.total_expense < 0) {
    throw new ValidationError("total_expense phải lớn hơn hoặc bằng 0");
  }

  if (data.total_support < 0) {
    throw new ValidationError("total_support phải lớn hơn hoặc bằng 0");
  }
}

function normalizeFilters(filters?: EventListFilters) {
  const page = Math.max(1, Number(filters?.page || 1));
  const limit = Math.min(
    EVENT_DEFAULTS.maxPageSize,
    Math.max(1, Number(filters?.limit || EVENT_DEFAULTS.pageSize))
  );
  const sortBy = filters?.sortBy || EVENT_DEFAULTS.sortBy;
  const sortOrder = filters?.sortOrder || EVENT_DEFAULTS.sortOrder;

  if (!VALID_SORT_FIELDS.includes(sortBy as any)) {
    throw new ValidationError("Trường sortBy không hợp lệ");
  }
  if (!VALID_SORT_ORDERS.includes(sortOrder as any)) {
    throw new ValidationError("sortOrder phải là asc hoặc desc");
  }

  return { page, limit, sortBy, sortOrder, search: filters?.search?.trim() };
}

export class EventsService {
  constructor(
    private eventsRepo: EventsRepository,
    private participantsRepo: EventParticipantsRepository
  ) {}

  /**
   * List events with pagination
   */
  async listEvents(filters?: EventListFilters): Promise<EventListResult> {
    const query = normalizeFilters(filters);
    const result = await this.eventsRepo.findPaginated(query);
    const totalPages = Math.max(1, Math.ceil(result.total / query.limit));

    return {
      items: result.items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages,
        hasMore: query.page < totalPages,
      },
    };
  }

  /**
   * Get event by ID with participants
   */
  async getEventWithParticipants(id: number): Promise<EventWithParticipants> {
    const event = await this.eventsRepo.findEventById(id);
    if (!event) throw new NotFoundError("sự kiện");

    const participants =
      await this.participantsRepo.findByEventWithUsers(id);
    const isSettled =
      participants.length > 0 &&
      participants.every((p) => p.contribution_per_person > 0);

    return {
      ...event,
      participants,
      participant_count: participants.length,
      is_settled: isSettled,
    };
  }

  /**
   * Create event
   */
  async createEvent(data: CreateEventData) {
    validateEventData(data);
    return this.eventsRepo.createEvent(data);
  }

  /**
   * Update event
   */
  async updateEvent(id: number, data: UpdateEventData) {
    const event = await this.eventsRepo.findEventById(id);
    if (!event) throw new NotFoundError("sự kiện");

    if (data.event_name !== undefined) {
      if (
        data.event_name.length < EVENT_NAME_MIN_LENGTH ||
        data.event_name.length > EVENT_NAME_MAX_LENGTH
      ) {
        throw new ValidationError(
          `event_name must be ${EVENT_NAME_MIN_LENGTH}-${EVENT_NAME_MAX_LENGTH} characters`
        );
      }
    }
    if (data.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.event_date)) {
      throw new ValidationError("event_date phải có định dạng YYYY-MM-DD");
    }

    return this.eventsRepo.updateEvent(id, data);
  }

  /**
   * Delete event (only if no paid participants)
   */
  async deleteEvent(id: number) {
    const event = await this.eventsRepo.findEventById(id);
    if (!event) throw new NotFoundError("sự kiện");

    const participants = await this.participantsRepo.findByEvent(id);
    const hasPaid = participants.some((p) => p.is_paid);
    if (hasPaid) {
      throw new InvalidStateError(
        "Cannot delete event with paid participants"
      );
    }

    return this.eventsRepo.deleteEvent(id);
  }

  /**
   * Add participants to event
   */
  async addParticipants(eventId: number, userIds: string[]) {
    const event = await this.eventsRepo.findEventById(eventId);
    if (!event) throw new NotFoundError("sự kiện");

    if (!userIds.length) {
      throw new ValidationError("Cần ít nhất một userId");
    }

    return this.participantsRepo.bulkAdd(eventId, userIds);
  }

  /**
   * Remove participant from event
   */
  async removeParticipant(eventId: number, userId: string) {
    const participants = await this.participantsRepo.findByEvent(eventId);
    const participant = participants.find((p) => p.user_id === userId);

    if (!participant) throw new NotFoundError("người tham gia");
    if (participant.is_paid) {
      throw new InvalidStateError("Không thể xóa người tham gia đã thanh toán");
    }

    return this.participantsRepo.removeParticipant(eventId, userId);
  }

  /**
   * Settle event — calculate contribution per person
   * Uses formula: (total_expense - total_support) / participant_count
   * Completely independent from monthly settlement
   */
  async settleEvent(eventId: number) {
    const event = await this.eventsRepo.findEventById(eventId);
    if (!event) throw new NotFoundError("sự kiện");

    const participantCount = await this.participantsRepo.countByEvent(eventId);
    if (participantCount === 0) {
      throw new InvalidStateError("Không thể chốt sự kiện khi chưa có người tham gia");
    }

    const contribution = calculateEventContributionPerPerson(
      event.total_expense,
      event.total_support,
      participantCount
    );

    const updated = await this.participantsRepo.updateContributions(
      eventId,
      contribution
    );

    return {
      eventId,
      contribution_per_person: contribution,
      participant_count: participantCount,
      total_expense: event.total_expense,
      total_support: event.total_support,
      deficit: Math.max(0, event.total_expense - event.total_support),
      updated_count: updated.length,
    };
  }

  /**
   * Mark participant as paid
   */
  async markParticipantPaid(eventId: number, userId: string) {
    const event = await this.eventsRepo.findEventById(eventId);
    if (!event) throw new NotFoundError("sự kiện");

    const participants = await this.participantsRepo.findByEvent(eventId);
    const participant = participants.find((p) => p.user_id === userId);
    if (!participant) throw new NotFoundError("người tham gia");

    if (participant.is_paid) {
      throw new ConflictError("Người tham gia đã được đánh dấu đã thanh toán");
    }

    return this.participantsRepo.markPaid(eventId, userId);
  }
}

export async function createEventsService(): Promise<EventsService> {
  const eventsRepo = await createEventsRepository();
  const participantsRepo = await createEventParticipantsRepository();
  return new EventsService(eventsRepo, participantsRepo);
}
