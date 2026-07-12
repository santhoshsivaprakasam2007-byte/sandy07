-- ============================================================
-- Full Study Calendar Schema Migration
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Expand calendar_events ────────────────────────────────
-- Adding new columns to support a full Google Calendar clone
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#4f46e5'; -- Default Indigo
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'::jsonb;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT FALSE;
