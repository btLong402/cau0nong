# Analytics Module

## Purpose

Provides dashboard statistics for the CLB management system. Aggregates data from sessions, settlements, and users to generate overview stats, attendance rankings, and expense trends.

## Data Sources

- `users` — active member count
- `session_attendance` — attendance ranking
- `sessions` — court expenses per month
- `months` — shuttlecock expenses, month grouping
- `monthly_settlements` — unpaid debt

## API

| Method | Path | Params | Description |
|--------|------|--------|-------------|
| GET | `/api/analytics?type=overview` | `type` | Overview stats (4 cards) |
| GET | `/api/analytics?type=attendance` | `type` | Attendance ranking (bar chart) |
| GET | `/api/analytics?type=expense` | `type` | Expense trend (line chart) |

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `AnalyticsService` | Class | Business logic |
| `createAnalyticsService()` | Factory | Creates service with repository |
| `OverviewStats` | Type | 4 stat values |
| `AttendanceRankItem` | Type | user + count |
| `ExpenseTrendItem` | Type | month + expenses |
