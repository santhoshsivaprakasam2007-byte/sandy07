-- ============================================================
-- Feature Expansion Schema
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Update Tasks Table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME;

-- 2. Update Profiles Table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS semester INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 120;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timer_settings JSONB DEFAULT '{"focusDuration": 25, "shortBreak": 5, "longBreak": 15, "longBreakInterval": 4, "autoStartBreak": true, "autoStartFocus": false, "soundEnabled": true, "volume": 0.7, "showAnimation": true, "notificationsEnabled": true}'::jsonb;
