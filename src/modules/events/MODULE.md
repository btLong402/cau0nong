# Events Module

## Purpose

Manages special events (giải đấu, liên hoan) independently from the monthly settlement engine. Supports CRUD operations on events, participant management, and per-person contribution calculation.

## Key Formula

```
contribution_per_person = (total_expense - total_support) / participant_count
```

This is completely separate from `monthly_settlements` — event costs are NOT rolled into monthly `total_due`.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `EventsService` | Class | Business logic for events |
| `createEventsService()` | Factory | Creates service with injected repositories |
| `EventsRepository` | Class | Data access for `events` table |
| `EventParticipantsRepository` | Class | Data access for `event_participants` table |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events` | List events (paginated) |
| POST | `/api/events` | Create event (admin) |
| GET | `/api/events/:id` | Get event with participants |
| PUT | `/api/events/:id` | Update event (admin) |
| DELETE | `/api/events/:id` | Delete event (admin) |
| GET | `/api/events/:id/participants` | List participants |
| POST | `/api/events/:id/participants` | Add participants |
| DELETE | `/api/events/:id/participants/:userId` | Remove participant |
| PUT | `/api/events/:id/participants/:userId` | Mark paid |
| POST | `/api/events/:id/settle` | Calculate contributions |
