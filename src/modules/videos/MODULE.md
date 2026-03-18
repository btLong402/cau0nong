# Videos Module

## Purpose

Manages a library of badminton skill videos (YouTube embeds). Admin can add, edit, and delete video links. Members can browse and watch videos by category.

## Categories

| Category | Label |
|----------|-------|
| `general` | Chung |
| `ky-thuat` | Kỹ thuật |
| `the-luc` | Thể lực |
| `chien-thuat` | Chiến thuật |
| `luat` | Luật |

## Database Table

```sql
CREATE TABLE public.videos (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  youtube_url varchar NOT NULL,
  description text,
  category varchar DEFAULT 'general',
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/videos?category=ky-thuat` | List videos |
| POST | `/api/videos` | Create video (admin) |
| PUT | `/api/videos/:id` | Update video (admin) |
| DELETE | `/api/videos/:id` | Delete video (admin) |
