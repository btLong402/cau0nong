/**
 * Events Module Constants
 */

export const EVENT_NAME_MAX_LENGTH = 200;
export const EVENT_NAME_MIN_LENGTH = 2;

export const EVENT_DEFAULTS = {
  pageSize: 20,
  maxPageSize: 100,
  sortBy: "event_date" as const,
  sortOrder: "desc" as const,
};

export const VALID_SORT_FIELDS = [
  "event_date",
  "created_at",
  "event_name",
] as const;

export const VALID_SORT_ORDERS = ["asc", "desc"] as const;
