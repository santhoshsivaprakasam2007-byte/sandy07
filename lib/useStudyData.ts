"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, format, subDays, isSameDay } from "date-fns";

export interface StudySession {
  id: number;
  user_id: string;
  session_type: "focus" | "short_break" | "long_break";
  subject: string;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  completed: boolean;
  task_id: number | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  college: string | null;
  department: string | null;
  semester: number | null;
  daily_goal_minutes: number;
  theme: string;
  timer_settings: any;
}

export interface Task {
  id: number;
  user_id: string;
  title: string;
  subject: string;
  category: string | null;
  notes: string | null;
  time_range: string;
  priority: string;
  completed: boolean;
  study_goal_minutes: number;
  study_minutes: number;
  due_date: string | null;
  due_time: string | null;
  created_at: string;
}

export interface DerivedStats {
  totalFocusMinutes: number;
  totalFocusHours: number;
  totalSessions: number;
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  avgSessionMinutes: number;
  longestSessionMinutes: number;
  currentStreak: number;
  longestStreak: number;
  last7Days: { label: string; minutes: number; date: string; sessions: number }[];
  last4Weeks: { label: string; minutes: number }[];
  todaySessions: number;
  completedToday: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  bestStudyDay: string;
  mostProductiveHour: string;
  productivityScore: number;
  last12Months: { label: string; minutes: number }[];
}

export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function calculateStreak(sessions: StudySession[]): { current: number; longest: number } {
  const focusDates = [
    ...new Set(
      sessions
        .filter((s) => s.session_type === "focus" && s.completed)
        .map((s) => startOfDay(new Date(s.created_at)).toDateString())
    ),
  ]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (focusDates.length === 0) return { current: 0, longest: 0 };

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  let current = 0;
  let ptr = new Date(today);
  for (const d of focusDates) {
    if (isSameDay(d, ptr) || isSameDay(d, today)) {
      current++;
      ptr = subDays(new Date(d), 1);
    } else if (current === 0 && isSameDay(d, yesterday)) {
      current++;
      ptr = subDays(new Date(d), 1);
    } else {
      break;
    }
  }

  const ascending = [...focusDates].reverse();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of ascending) {
    if (!prev) {
      run = 1;
    } else {
      const expected = new Date(prev);
      expected.setDate(expected.getDate() + 1);
      if (isSameDay(d, expected)) {
        run++;
      } else {
        longest = Math.max(longest, run);
        run = 1;
      }
    }
    prev = d;
  }
  longest = Math.max(longest, run);

  return { current, longest };
}

function derivedStatsFromData(sessions: StudySession[], tasks: Task[]): DerivedStats {
  const focusSessions = sessions.filter((s) => s.session_type === "focus" && s.completed);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
  const monthStart = startOfMonth(now);

  const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const todaySessions = focusSessions.filter((s) => isSameDay(new Date(s.created_at), now));
  const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  
  const weekSessions = focusSessions.filter((s) => new Date(s.created_at) >= weekStart);
  const weekMinutes = weekSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  
  const monthSessions = focusSessions.filter((s) => new Date(s.created_at) >= monthStart);
  const monthMinutes = monthSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  const avgSessionMinutes = focusSessions.length > 0
    ? Math.round(totalFocusMinutes / focusSessions.length)
    : 0;

  const longestSessionMinutes = focusSessions.length > 0
    ? Math.max(...focusSessions.map((s) => s.duration_minutes || 0))
    : 0;

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(todayStart, 6 - i);
    const daySessions = focusSessions.filter((s) => isSameDay(new Date(s.created_at), d));
    const mins = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    return {
      label: i === 6 ? "Today" : format(d, "EEE"),
      minutes: mins,
      date: format(d, "yyyy-MM-dd"),
      sessions: daySessions.length,
    };
  });

  // Last 4 weeks
  const last4Weeks = Array.from({ length: 4 }, (_, i) => {
    const end = subDays(todayStart, i * 7);
    const start = subDays(end, 6);
    const mins = focusSessions
      .filter((s) => {
        const d = new Date(s.created_at);
        return d >= start && d <= end;
      })
      .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    return { label: i === 0 ? "This week" : `${i}w ago`, minutes: mins };
  }).reverse();

  const { current, longest } = calculateStreak(sessions);
  const completedTasksCount = tasks.filter((t) => t.completed).length;

  // Best Study Day (Day of week with most total focus time)
  const daysMap = { "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0 };
  focusSessions.forEach(s => {
    const d = new Date(s.created_at);
    const dayLabel = format(d, "EEE") as keyof typeof daysMap;
    daysMap[dayLabel] += (s.duration_minutes || 0);
  });
  let bestStudyDay = "N/A";
  let maxDayMins = 0;
  Object.entries(daysMap).forEach(([day, mins]) => {
    if (mins > maxDayMins) { maxDayMins = mins; bestStudyDay = day; }
  });

  // Most Productive Hour
  const hoursMap: Record<number, number> = {};
  focusSessions.forEach(s => {
    const h = new Date(s.created_at).getHours();
    hoursMap[h] = (hoursMap[h] || 0) + (s.duration_minutes || 0);
  });
  let bestHour = -1;
  let maxHourMins = 0;
  Object.entries(hoursMap).forEach(([h, mins]) => {
    if (mins > maxHourMins) { maxHourMins = mins; bestHour = parseInt(h); }
  });
  const mostProductiveHour = bestHour >= 0 ? `${bestHour === 0 ? 12 : bestHour > 12 ? bestHour - 12 : bestHour}${bestHour >= 12 ? 'PM' : 'AM'}` : "N/A";

  // Productivity Score (0-100)
  // Baseline: 4 hours a day = 240 mins.
  const productivityScore = Math.min(100, Math.round((todayMinutes / 240) * 100));

  // Last 12 Months
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mins = focusSessions.filter(s => {
      const sd = new Date(s.created_at);
      return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
    }).reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    return { label: format(d, "MMM"), minutes: mins };
  }).reverse();

  return {
    totalFocusMinutes,
    totalFocusHours: totalFocusMinutes / 60,
    totalSessions: focusSessions.length,
    todayMinutes,
    weekMinutes,
    monthMinutes,
    avgSessionMinutes,
    longestSessionMinutes,
    currentStreak: current,
    longestStreak: longest,
    last7Days,
    last4Weeks,
    todaySessions: todaySessions.length,
    completedToday: todaySessions.length,
    totalTasks: tasks.length,
    completedTasks: completedTasksCount,
    pendingTasks: tasks.length - completedTasksCount,
    bestStudyDay,
    mostProductiveHour,
    productivityScore,
    last12Months,
  };
}

export function useStudyData() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [derived, setDerived] = useState<DerivedStats>({
    totalFocusMinutes: 0,
    totalFocusHours: 0,
    totalSessions: 0,
    todayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    avgSessionMinutes: 0,
    longestSessionMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    last7Days: [],
    last4Weeks: [],
    todaySessions: 0,
    completedToday: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    bestStudyDay: "N/A",
    mostProductiveHour: "N/A",
    productivityScore: 0,
    last12Months: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    setUserId(user.id);

    const ninetyDaysAgo = subDays(new Date(), 90);

    const [sessionsRes, tasksRes] = await Promise.all([
      supabase.from("study_sessions").select("*").eq("user_id", user.id).gte("created_at", ninetyDaysAgo.toISOString()).order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (sessionsRes.error) console.error("Error fetching study_sessions:", sessionsRes.error);
    if (tasksRes.error) console.error("Error fetching tasks:", tasksRes.error);

    const fetchedSessions = (sessionsRes.data ?? []) as StudySession[];
    const fetchedTasks = (tasksRes.data ?? []) as Task[];

    setSessions(fetchedSessions);
    setTasks(fetchedTasks);
    setDerived(derivedStatsFromData(fetchedSessions, fetchedTasks));

    // Update user_stats in background
    const d = derivedStatsFromData(fetchedSessions, fetchedTasks);
    supabase.from("user_stats").upsert({
      id: user.id,
      deep_work_hours: parseFloat((d.totalFocusMinutes / 60).toFixed(4)),
      tasks_completed: d.completedTasks,
      streak_days: d.currentStreak,
      longest_streak: d.longestStreak,
      total_sessions: d.totalSessions,
    }, { onConflict: "id" }).then(() => {});

    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel("study-data-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_sessions" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return {
    sessions,
    tasks,
    derived,
    isLoading,
    userId,
    refresh,
  };
}
