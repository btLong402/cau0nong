-- ============================================================================
-- Migration 002: Add payer offset fields to monthly_settlements
-- Tracks how much each user has advanced (ứng tiền) for court/shuttlecock
-- so it can be offset against their monthly dues.
-- ============================================================================

ALTER TABLE monthly_settlements 
  ADD COLUMN IF NOT EXISTS court_payer_offset NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shuttlecock_buyer_offset NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Add event_debt column for Phase 3 (Event → Month linkage)
ALTER TABLE monthly_settlements 
  ADD COLUMN IF NOT EXISTS event_debt NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Add month_id to events for Phase 3 (optional link event to month)
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS month_id INTEGER REFERENCES months(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_month_id ON events(month_id);

COMMENT ON COLUMN monthly_settlements.court_payer_offset IS 'Tổng tiền sân mà user đã ứng trả trong tháng (cấn trừ vào total_due)';
COMMENT ON COLUMN monthly_settlements.shuttlecock_buyer_offset IS 'Tổng tiền cầu mà user đã ứng mua trong tháng (cấn trừ vào total_due)';
COMMENT ON COLUMN monthly_settlements.event_debt IS 'Tổng tiền sự kiện chưa trả gắn vào tháng này';
COMMENT ON COLUMN events.month_id IS 'Optional: gắn event vào tháng để cộng dồn nợ';
