-- ============================================================
-- Cognitive Clarity — Complete Schema Migration
-- Safe to run on existing databases (uses IF NOT EXISTS)
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. study_sessions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_sessions (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_type     TEXT    DEFAULT 'focus',
  subject          TEXT    DEFAULT 'General Study',
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  start_time       TIMESTAMPTZ,
  end_time         TIMESTAMPTZ,
  completed        BOOLEAN DEFAULT TRUE,
  task_id          BIGINT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns that may be missing on existing tables
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'focus';
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS start_time   TIMESTAMPTZ;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS end_time     TIMESTAMPTZ;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS task_id      BIGINT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS subject      TEXT DEFAULT 'General Study';

-- ── 2. user_stats ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stats (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  deep_work_hours  DECIMAL(10,4) DEFAULT 0,
  tasks_completed  INTEGER DEFAULT 0,
  streak_days      INTEGER DEFAULT 0,
  longest_streak   INTEGER DEFAULT 0,
  avg_focus_score  INTEGER DEFAULT 85,
  total_sessions   INTEGER DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS longest_streak  INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_sessions  INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS avg_focus_score INTEGER DEFAULT 85;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- ── 3. tasks ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title              TEXT NOT NULL,
  subject            TEXT DEFAULT 'General',
  time_range         TEXT DEFAULT 'Anytime',
  priority           TEXT DEFAULT 'Med Priority',
  completed          BOOLEAN DEFAULT FALSE,
  study_goal_minutes INTEGER DEFAULT 0,
  study_minutes      INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS study_goal_minutes INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS study_minutes      INTEGER DEFAULT 0;

-- ── 4. Row Level Security ───────────────────────────────────
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users manage own stats"    ON user_stats;
DROP POLICY IF EXISTS "Users manage own tasks"    ON tasks;

CREATE POLICY "Users manage own sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own stats" ON user_stats
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 5. Enable Realtime Replication ─────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
