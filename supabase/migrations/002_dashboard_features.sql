-- ============================================================
-- Dashboard Overhaul Schema Migration
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Calendar Events ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  event_date  TIMESTAMPTZ NOT NULL,
  category    TEXT DEFAULT 'Study' CHECK (category IN ('Study', 'Completed', 'Exams', 'Assignments', 'Personal')),
  completed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. User Goals ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_goals (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_minutes     INTEGER DEFAULT 60,
  weekly_minutes    INTEGER DEFAULT 300,
  monthly_minutes   INTEGER DEFAULT 1200,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. User Achievements ───────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id    TEXT NOT NULL, -- e.g., 'first_session', '1h_focus', '7d_streak'
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ── 4. Add Due Date to Tasks (if missing) ──────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- ── 5. Row Level Security ──────────────────────────────────
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own calendar" ON calendar_events;
DROP POLICY IF EXISTS "Users manage own goals" ON user_goals;
DROP POLICY IF EXISTS "Users manage own achievements" ON user_achievements;

CREATE POLICY "Users manage own calendar" ON calendar_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own goals" ON user_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 6. Enable Realtime Replication ─────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE user_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
