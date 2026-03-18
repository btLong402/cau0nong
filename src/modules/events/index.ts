/**
 * Events Module — Barrel Exports
 */

export { EventsService, createEventsService } from "./events.service";
export {
  EventsRepository,
  createEventsRepository,
} from "./events.repository";
export {
  EventParticipantsRepository,
  createEventParticipantsRepository,
} from "./event-participants.repository";
export type {
  Event,
  EventParticipant,
  CreateEventData,
  UpdateEventData,
  EventWithParticipants,
  EventParticipantWithUser,
  EventListFilters,
  EventListResult,
} from "./types";
export {
  EVENT_NAME_MAX_LENGTH,
  EVENT_NAME_MIN_LENGTH,
  EVENT_DEFAULTS,
} from "./constants";
