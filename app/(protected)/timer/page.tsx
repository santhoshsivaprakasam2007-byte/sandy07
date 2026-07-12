"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "../../../utils/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

type SessionType = "focus" | "short_break" | "long_break";

interface TimerSettings {
  focusDuration: number;   // minutes
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number; // focus sessions before long break
  autoStartBreak: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  volume: number; // 0–1
  showAnimation: boolean;
  notificationsEnabled: boolean;
}

interface TimerState {
  timeLeft: number;        // seconds
  totalDuration: number;   // seconds for current session
  isRunning: boolean;
  isPaused: boolean;
  sessionType: SessionType;
  focusCount: number;      // completed focus sessions in this chain
  startedAt: number | null; // Date.now() when session started
}

interface SessionStats {
  todayCount: number;
  completedToday: number;
  totalFocusMinutesToday: number;
  streak: number;
}

interface Task {
  id: number;
  title: string;
  subject?: string;
  completed: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: "25 / 5", focus: 25, short: 5, long: 15, name: "Classic Pomodoro" },
  { label: "50 / 10", focus: 50, short: 10, long: 25, name: "Deep Work" },
  { label: "60 / 15", focus: 60, short: 15, long: 30, name: "Power Hour" },
  { label: "90 / 20", focus: 90, short: 20, long: 45, name: "Ultra Focus" },
  { label: "Custom", focus: 0, short: 0, long: 0, name: "Custom" },
];

const MOTIVATIONAL_QUOTES = [
  "Deep work is the superpower of the 21st century.",
  "Focus is the art of knowing what to ignore.",
  "One session at a time. Progress compounds.",
  "You don't rise to the level of your goals — you fall to the level of your systems.",
  "The quality of your attention determines the quality of your work.",
  "Every expert was once a beginner who refused to quit.",
  "Flow state is on the other side of resistance.",
  "Small consistent actions create remarkable results.",
  "Your future self is watching. Make them proud.",
  "Energy flows where attention goes.",
];

const SESSION_CONFIG: Record<SessionType, { label: string; emoji: string; colorClass: string; ringColor: string }> = {
  focus: {
    label: "Focus Session",
    emoji: "🧠",
    colorClass: "text-primary",
    ringColor: "#4648d4",
  },
  short_break: {
    label: "Short Break",
    emoji: "☕",
    colorClass: "text-[#00685d]",
    ringColor: "#00685d",
  },
  long_break: {
    label: "Long Break",
    emoji: "🌿",
    colorClass: "text-[#8127cf]",
    ringColor: "#8127cf",
  },
};

const LOCAL_STORAGE_KEY = "pomodoro_state_v2";
const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  autoStartBreak: true,
  autoStartFocus: false,
  soundEnabled: true,
  volume: 0.7,
  showAnimation: true,
  notificationsEnabled: true,
};

// ─── Audio Utilities ──────────────────────────────────────────────────────────

function playAlarmSound(volume: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.4);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.5);
    });
  } catch {
    // Audio not supported — fail silently
  }
}

function playTickSound(volume: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(volume * 0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // fail silently
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PomodoroTimer() {
  const supabase = createClient();

  // Settings
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [customPreset, setCustomPreset] = useState(false);
  const [activePresetIdx, setActivePresetIdx] = useState(0);

  // Custom preset draft values (what the user is editing before clicking Apply)
  const [customDraft, setCustomDraft] = useState({
    focus: DEFAULT_SETTINGS.focusDuration,
    short: DEFAULT_SETTINGS.shortBreak,
    long: DEFAULT_SETTINGS.longBreak,
  });

  // Timer
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [totalDuration, setTotalDuration] = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>("focus");
  const [focusCount, setFocusCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // Stats
  const [stats, setStats] = useState<SessionStats>({
    todayCount: 0,
    completedToday: 0,
    totalFocusMinutesToday: 0,
    streak: 0,
  });

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  // UI
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const circumference = 2 * Math.PI * 120; // r=120 in viewBox 280x280
  const dashOffset = circumference * (1 - progress);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const sessionCfg = SESSION_CONFIG[sessionType];
  const percentComplete = Math.round(progress * 100);

  // ── localStorage Persistence ─────────────────────────────────────────────

  const saveToStorage = useCallback(
    (tl: number, total: number, running: boolean, paused: boolean, type: SessionType, fc: number, sa: number | null) => {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({ timeLeft: tl, totalDuration: total, isRunning: running, isPaused: paused, sessionType: type, focusCount: fc, startedAt: sa, settings, selectedTaskId: selectedTask?.id ?? null, savedAt: Date.now() })
        );
      } catch {}
    },
    [settings, selectedTask]
  );

  const restoreFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      // Only restore if saved within the last 24 hours
      if (Date.now() - saved.savedAt > 86_400_000) return false;

      let tl = saved.timeLeft as number;
      // If the timer was running, subtract elapsed time
      if (saved.isRunning && !saved.isPaused && saved.startedAt) {
        const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
        tl = Math.max(0, tl - elapsed);
      }

      if (saved.settings) setSettings(saved.settings);
      setTimeLeft(tl);
      setTotalDuration(saved.totalDuration);
      setSessionType(saved.sessionType as SessionType);
      setFocusCount(saved.focusCount);
      setIsPaused(saved.isPaused);
      // Re-run if it was running and not done
      if (saved.isRunning && !saved.isPaused && tl > 0) {
        setIsRunning(true);
        setStartedAt(Date.now());
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Supabase Data Fetch ───────────────────────────────────────────────────

  useEffect(() => {
    const restored = restoreFromStorage();
    if (!restored) {
      setTimeLeft(DEFAULT_SETTINGS.focusDuration * 60);
      setTotalDuration(DEFAULT_SETTINGS.focusDuration * 60);
    }
    setIsLoaded(true);

    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch tasks for picker
      const { data: taskData } = await supabase
        .from("tasks")
        .select("id, title, subject, completed")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (taskData) setTasks(taskData as Task[]);

      // Fetch stats from user_stats
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("streak_days, tasks_completed, deep_work_hours")
        .eq("id", user.id)
        .single();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("timer_settings")
        .eq("id", user.id)
        .single();

      if (profileData?.timer_settings) {
        setSettings((prev) => {
          const merged = { ...prev, ...profileData.timer_settings };
          // If we didn't restore an active timer, update the time based on DB settings
          if (!restored) {
            setTimeLeft(merged.focusDuration * 60);
            setTotalDuration(merged.focusDuration * 60);
          }
          return merged;
        });
      }

      // Fetch today's study sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: sessionData } = await supabase
        .from("study_sessions")
        .select("duration_minutes, completed")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      const todayCompleted = sessionData?.filter((s: any) => s.completed) ?? [];
      const totalMinutesToday = todayCompleted.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0);

      setStats({
        todayCount: sessionData?.length ?? 0,
        completedToday: todayCompleted.length,
        totalFocusMinutesToday: totalMinutesToday,
        streak: statsData?.streak_days ?? 0,
      });
    }
    fetchData();
  }, []);

  // ── Timer Tick ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(intervalRef.current!);
            handleSessionEnd();
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused]);

  // Persist state whenever key values change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(timeLeft, totalDuration, isRunning, isPaused, sessionType, focusCount, startedAt);
    }
  }, [timeLeft, isRunning, isPaused, sessionType, focusCount, isLoaded]);

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "r":
        case "R":
          handleReset();
          break;
        case "s":
        case "S":
          handleSkip();
          break;
        case "Escape":
          handleStop();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isRunning, isPaused, sessionType, focusCount, settings]);

  // ── Session Completion ────────────────────────────────────────────────────

  const handleSessionEnd = useCallback(async () => {
    setIsRunning(false);
    setIsPaused(false);

    if (settings.soundEnabled) playAlarmSound(settings.volume);

    // Vibrate on mobile
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);

    // Browser notification
    if (settings.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification(
        sessionType === "focus" ? "🧠 Focus Session Complete!" : `${sessionCfg.emoji} Break Over!`,
        {
          body:
            sessionType === "focus"
              ? "Great work! Time for a break."
              : "Break's done. Ready to focus again?",
          icon: "/favicon.ico",
        }
      );
    }

    if (sessionType === "focus") {
      const newFocusCount = focusCount + 1;
      setFocusCount(newFocusCount);
      setQuoteIdx((q) => (q + 1) % MOTIVATIONAL_QUOTES.length);

      // Save to Supabase
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const durationMin = settings.focusDuration;
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - durationMin * 60 * 1000);

        // Insert completed session with full time data
        const { error: insertError } = await supabase.from("study_sessions").insert([{
          user_id: user.id,
          session_type: "focus",
          subject: selectedTask?.subject ?? selectedTask?.title ?? "General Study",
          duration_minutes: durationMin,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          completed: true,
          task_id: selectedTask?.id ?? null,
        }]);

        if (insertError) {
          console.error("Failed to save study session to Supabase:", insertError);
        }

        // If a task was selected, increment its study_minutes
        if (selectedTask?.id) {
          const { data: taskRow } = await supabase
            .from("tasks")
            .select("study_minutes, study_goal_minutes, completed")
            .eq("id", selectedTask.id)
            .single();
          if (taskRow) {
            const newMinutes = (taskRow.study_minutes || 0) + durationMin;
            const goalMet =
              taskRow.study_goal_minutes > 0 &&
              newMinutes >= taskRow.study_goal_minutes;
            await supabase
              .from("tasks")
              .update({
                study_minutes: newMinutes,
                ...(goalMet ? { completed: true } : {}),
              })
              .eq("id", selectedTask.id);
          }
        }

        // Update local timer stats immediately (realtime hook on dashboard/stats handles the rest)
        setStats((prev: any) => ({
          ...prev,
          completedToday: (prev?.completedToday ?? 0) + 1,
          todayCount: (prev?.todayCount ?? 0) + 1,
          totalFocusMinutesToday: (prev?.totalFocusMinutesToday ?? 0) + durationMin,
        }));
      }
      setIsSaving(false);

      // Advance to break
      const nextType: SessionType =
        newFocusCount % settings.longBreakInterval === 0 ? "long_break" : "short_break";
      const breakDuration = nextType === "long_break" ? settings.longBreak : settings.shortBreak;
      setStatusMessage(nextType === "long_break" ? "Time for a long break! 🌿" : "Take a short break! ☕");
      if (settings.autoStartBreak) {
        advanceTo(nextType, breakDuration, true);
      } else {
        advanceTo(nextType, breakDuration, false);
      }
    } else {
      // Break ended — go back to focus
      setStatusMessage("Break's over — time to focus! 🧠");
      if (settings.autoStartFocus) {
        advanceTo("focus", settings.focusDuration, true);
      } else {
        advanceTo("focus", settings.focusDuration, false);
      }
    }
  }, [sessionType, focusCount, settings, selectedTask]);

  const advanceTo = (type: SessionType, durationMinutes: number, autoStart: boolean) => {
    const secs = durationMinutes * 60;
    setSessionType(type);
    setTimeLeft(secs);
    setTotalDuration(secs);
    setStartedAt(autoStart ? Date.now() : null);
    setIsRunning(autoStart);
    setIsPaused(false);
  };

  // ── Controls ──────────────────────────────────────────────────────────────

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const handlePlayPause = () => {
    if (!isRunning && !isPaused) {
      // Fresh start
      requestNotificationPermission();
      setIsRunning(true);
      setIsPaused(false);
      setStartedAt(Date.now());
    } else if (isRunning && !isPaused) {
      // Pause
      setIsPaused(true);
      setIsRunning(false);
    } else if (isPaused) {
      // Resume
      setIsPaused(false);
      setIsRunning(true);
      setStartedAt(Date.now());
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setStartedAt(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setStartedAt(null);
    const dur = sessionType === "focus"
      ? settings.focusDuration
      : sessionType === "short_break"
      ? settings.shortBreak
      : settings.longBreak;
    setTimeLeft(dur * 60);
    setTotalDuration(dur * 60);
  };

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setStartedAt(null);
    if (sessionType === "focus") {
      const newFocusCount = focusCount + 1;
      setFocusCount(newFocusCount);
      const nextType: SessionType =
        newFocusCount % settings.longBreakInterval === 0 ? "long_break" : "short_break";
      advanceTo(nextType, nextType === "long_break" ? settings.longBreak : settings.shortBreak, false);
    } else {
      advanceTo("focus", settings.focusDuration, false);
    }
  };

  const applyPreset = (idx: number) => {
    const preset = PRESETS[idx];
    if (preset.name === "Custom") {
      // Pre-populate draft with current settings so user can see and edit them
      setCustomDraft({
        focus: settings.focusDuration,
        short: settings.shortBreak,
        long: settings.longBreak,
      });
      setCustomPreset(true);
      setActivePresetIdx(idx);
      return;
    }
    setCustomPreset(false);
    setActivePresetIdx(idx);
    const newSettings = { ...settings, focusDuration: preset.focus, shortBreak: preset.short, longBreak: preset.long };
    setSettings(newSettings);
    setIsRunning(false);
    setIsPaused(false);
    setStartedAt(null);
    setSessionType("focus");
    setTimeLeft(preset.focus * 60);
    setTotalDuration(preset.focus * 60);
  };

  // Commit the custom draft values to settings and update the timer
  const applyCustomPreset = () => {
    const focus = Math.min(180, Math.max(1, Number(customDraft.focus) || 1));
    const short = Math.min(60,  Math.max(1, Number(customDraft.short) || 1));
    const long  = Math.min(90,  Math.max(1, Number(customDraft.long)  || 1));
    const newSettings = { ...settings, focusDuration: focus, shortBreak: short, longBreak: long };
    setSettings(newSettings);
    setIsRunning(false);
    setIsPaused(false);
    setStartedAt(null);
    setSessionType("focus");
    setTimeLeft(focus * 60);
    setTotalDuration(focus * 60);
    // Close the custom panel so the user can see the updated timer ring
    setCustomPreset(false);
    setStatusMessage(`✅ Custom timer set — ${focus}m focus · ${short}m short · ${long}m long break`);
    // Clear the status message after 4 seconds
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const updateDuration = (key: keyof TimerSettings, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    // Always update timeLeft/totalDuration if the timer isn't actively running
    if (!isRunning && !isPaused) {
      if (key === "focusDuration") {
        if (sessionType === "focus") {
          setTimeLeft(value * 60);
          setTotalDuration(value * 60);
        }
      } else if (key === "shortBreak") {
        if (sessionType === "short_break") {
          setTimeLeft(value * 60);
          setTotalDuration(value * 60);
        }
      } else if (key === "longBreak") {
        if (sessionType === "long_break") {
          setTimeLeft(value * 60);
          setTotalDuration(value * 60);
        }
      }
    }
  };

  // ── Ring pulse animation class ─────────────────────────────────────────────
  const ringPulse = isRunning && settings.showAnimation
    ? "animate-pulse-soft"
    : "";

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-full pb-10 select-none">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-[0.06] blur-[100px]"
          style={{ background: sessionCfg.ringColor, transition: "background 1.5s ease" }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-[0.06] blur-[100px]"
          style={{ background: sessionCfg.ringColor, transition: "background 1.5s ease" }}
        />
      </div>

      {/* Accessibility live region */}
      <div ref={statusRef} aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-2 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Pomodoro Timer</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Stay focused. Build momentum.</p>
          </div>
          <button
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Toggle settings"
            className={`p-2.5 rounded-xl border transition-all ${showSettings ? "bg-primary text-white border-primary" : "bg-surface-container border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/40"}`}
          >
            <span className="material-symbols-outlined text-[22px]">tune</span>
          </button>
        </div>

        {/* ── Status Message ──────────────────────────────────────────────── */}
        {statusMessage && (
          <div className="text-center text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 animate-pulse-soft">
            {statusMessage}
          </div>
        )}

        {/* ── Preset Buttons ──────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => applyPreset(i)}
              aria-label={`Preset: ${p.name}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activePresetIdx === i
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-surface-container border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Custom Preset Form (shown only when Custom is selected) ──────── */}
        {customPreset && (
          <div className="bg-surface-container-low border border-primary/30 rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">edit_note</span>
                Custom Timer Durations
              </h3>
              <span className="text-xs text-on-surface-variant">1 min – max limits apply</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Focus */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                  🧠 Focus
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={customDraft.focus}
                    onChange={(e) =>
                      setCustomDraft((d) => ({ ...d, focus: parseInt(e.target.value) || 1 }))
                    }
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface-container text-on-surface text-center text-lg font-bold py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    aria-label="Custom focus duration in minutes"
                  />
                  <span className="text-xs text-on-surface-variant shrink-0">min</span>
                </div>
                <input
                  type="range" min={1} max={180} value={customDraft.focus}
                  onChange={(e) => setCustomDraft((d) => ({ ...d, focus: parseInt(e.target.value) }))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                  aria-label="Focus duration slider"
                />
              </div>

              {/* Short Break */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                  ☕ Short Break
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={customDraft.short}
                    onChange={(e) =>
                      setCustomDraft((d) => ({ ...d, short: parseInt(e.target.value) || 1 }))
                    }
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface-container text-on-surface text-center text-lg font-bold py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    aria-label="Custom short break duration in minutes"
                  />
                  <span className="text-xs text-on-surface-variant shrink-0">min</span>
                </div>
                <input
                  type="range" min={1} max={60} value={customDraft.short}
                  onChange={(e) => setCustomDraft((d) => ({ ...d, short: parseInt(e.target.value) }))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                  aria-label="Short break duration slider"
                />
              </div>

              {/* Long Break */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                  🌿 Long Break
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={customDraft.long}
                    onChange={(e) =>
                      setCustomDraft((d) => ({ ...d, long: parseInt(e.target.value) || 1 }))
                    }
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface-container text-on-surface text-center text-lg font-bold py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    aria-label="Custom long break duration in minutes"
                  />
                  <span className="text-xs text-on-surface-variant shrink-0">min</span>
                </div>
                <input
                  type="range" min={1} max={90} value={customDraft.long}
                  onChange={(e) => setCustomDraft((d) => ({ ...d, long: parseInt(e.target.value) }))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                  aria-label="Long break duration slider"
                />
              </div>
            </div>

            {/* Preview summary */}
            <div className="flex items-center gap-3 text-xs text-on-surface-variant bg-surface-container rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-[14px] text-primary">preview</span>
              <span>Focus <strong className="text-on-surface">{customDraft.focus}m</strong></span>
              <span>→</span>
              <span>Short Break <strong className="text-on-surface">{customDraft.short}m</strong></span>
              <span>→</span>
              <span>Long Break <strong className="text-on-surface">{customDraft.long}m</strong></span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={applyCustomPreset}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                aria-label="Apply custom timer settings"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Apply Custom Timer
              </button>
              <button
                onClick={() => { setCustomPreset(false); setActivePresetIdx(0); applyPreset(0); }}
                className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant text-sm hover:border-primary/40 hover:text-primary active:scale-95 transition-all"
                aria-label="Cancel custom and go back to Classic Pomodoro"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Main Layout: Ring + Controls ─────────────────────────────────── */}
        <div className="flex flex-col items-center gap-6">

          {/* Session type tabs */}
          <div className="flex gap-1 bg-surface-container rounded-full p-1">
            {(["focus", "short_break", "long_break"] as SessionType[]).map((type) => {
              const cfg = SESSION_CONFIG[type];
              const isActive = sessionType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    if (isRunning) return;
                    setSessionType(type);
                    const dur = type === "focus" ? settings.focusDuration : type === "short_break" ? settings.shortBreak : settings.longBreak;
                    setTimeLeft(dur * 60);
                    setTotalDuration(dur * 60);
                    setIsPaused(false);
                    setStartedAt(null);
                  }}
                  disabled={isRunning}
                  aria-label={`Switch to ${cfg.label}`}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-surface-container-highest text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Progress Ring */}
          <div className={`relative flex items-center justify-center ${ringPulse}`}>
            <svg
              width="280"
              height="280"
              viewBox="0 0 280 280"
              className="-rotate-90"
              aria-hidden="true"
            >
              {/* Track */}
              <circle
                cx="140" cy="140" r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-surface-container-high"
              />
              {/* Glow ring (decorative) */}
              <circle
                cx="140" cy="140" r="120"
                fill="none"
                stroke={sessionCfg.ringColor}
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                opacity="0.2"
                style={{ filter: `blur(4px)`, transition: "stroke-dashoffset 1s linear, stroke 1.5s ease" }}
              />
              {/* Progress arc */}
              <circle
                cx="140" cy="140" r="120"
                fill="none"
                stroke={sessionCfg.ringColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear, stroke 1.5s ease" }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute flex flex-col items-center gap-1">
              <span className="text-3xl">{sessionCfg.emoji}</span>
              <div
                role="timer"
                aria-label={`Time remaining: ${displayTime}`}
                className="text-[68px] font-bold leading-none text-on-surface tracking-tighter tabular-nums"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {displayTime}
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-[0.18em] mt-1"
                style={{ color: sessionCfg.ringColor }}
              >
                {isSaving ? "Saving…" : sessionCfg.label}
              </span>
              <span className="text-xs text-on-surface-variant mt-0.5">
                {percentComplete}% complete
              </span>
            </div>
          </div>

          {/* ── Controls ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            {/* Reset */}
            <button
              onClick={handleReset}
              aria-label="Reset timer (R)"
              title="Reset (R)"
              className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center justify-center transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">replay</span>
            </button>

            {/* Stop */}
            <button
              onClick={handleStop}
              aria-label="Stop timer (Esc)"
              title="Stop (Esc)"
              className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:text-error hover:border-error/40 flex items-center justify-center transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">stop</span>
            </button>

            {/* Primary Play/Pause */}
            <button
              onClick={handlePlayPause}
              aria-label={isRunning && !isPaused ? "Pause timer (Space)" : isPaused ? "Resume timer (Space)" : "Start timer (Space)"}
              title="Play/Pause (Space)"
              className="w-20 h-20 rounded-full text-white flex items-center justify-center shadow-xl transition-all active:scale-90"
              style={{ background: `linear-gradient(135deg, ${sessionCfg.ringColor}, ${sessionCfg.ringColor}cc)`, boxShadow: `0 8px 32px ${sessionCfg.ringColor}44` }}
            >
              <span
                className="material-symbols-outlined text-[36px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isRunning && !isPaused ? "pause" : "play_arrow"}
              </span>
            </button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              aria-label="Skip current session (S)"
              title="Skip (S)"
              className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center justify-center transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">skip_next</span>
            </button>

            {/* Next Session label */}
            <button
              onClick={() => advanceTo(sessionType === "focus" ? "short_break" : "focus", sessionType === "focus" ? settings.shortBreak : settings.focusDuration, false)}
              aria-label="Go to next session"
              title="Next Session"
              className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center justify-center transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">fast_forward</span>
            </button>
          </div>

          {/* Keyboard shortcut hints */}
          <div className="flex gap-4 text-[11px] text-on-surface-variant/60">
            <span><kbd className="bg-surface-container px-1 py-0.5 rounded text-[10px] font-mono">Space</kbd> Play/Pause</span>
            <span><kbd className="bg-surface-container px-1 py-0.5 rounded text-[10px] font-mono">R</kbd> Reset</span>
            <span><kbd className="bg-surface-container px-1 py-0.5 rounded text-[10px] font-mono">S</kbd> Skip</span>
            <span><kbd className="bg-surface-container px-1 py-0.5 rounded text-[10px] font-mono">Esc</kbd> Stop</span>
          </div>
        </div>

        {/* ── Stats Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "timer", label: "Today's Sessions", value: stats.todayCount },
            { icon: "task_alt", label: "Completed", value: stats.completedToday },
            { icon: "schedule", label: "Focus Time", value: `${stats.totalFocusMinutesToday}m` },
            { icon: "local_fire_department", label: "Streak", value: `${stats.streak}d` },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col gap-1"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">{s.icon}</span>
              <div className="text-2xl font-bold text-on-surface">{s.value}</div>
              <div className="text-[11px] text-on-surface-variant">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Task Integration ─────────────────────────────────────────────── */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">task</span>
              Task
            </h2>
            <button
              onClick={() => setShowTaskPicker((v) => !v)}
              className="text-xs text-primary font-medium hover:underline"
              aria-label={showTaskPicker ? "Collapse task picker" : "Expand task picker"}
            >
              {showTaskPicker ? "Collapse" : selectedTask ? "Change" : "Select Task"}
            </button>
          </div>

          {selectedTask ? (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-on-surface">{selectedTask.title}</p>
                {selectedTask.subject && (
                  <p className="text-xs text-on-surface-variant">{selectedTask.subject}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                aria-label="Remove selected task"
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant italic">
              You can start a focus session without selecting a task.
            </p>
          )}

          {showTaskPicker && (
            <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">
                  No pending tasks found. <a href="/planner" className="text-primary underline">Create one</a>
                </p>
              ) : (
                tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => { setSelectedTask(task); setShowTaskPicker(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                      selectedTask?.id === task.id
                        ? "bg-primary text-white"
                        : "hover:bg-surface-container text-on-surface"
                    }`}
                  >
                    {task.title}
                    {task.subject && <span className="ml-2 text-xs opacity-70">{task.subject}</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Motivational Quote ───────────────────────────────────────────── */}
        {sessionType === "focus" && (
          <div className="text-center px-4 py-5 bg-gradient-to-br from-primary/5 to-secondary/5 border border-outline-variant/20 rounded-2xl">
            <span className="material-symbols-outlined text-[18px] text-primary mb-2 block">format_quote</span>
            <p className="text-sm text-on-surface-variant italic leading-relaxed">
              "{MOTIVATIONAL_QUOTES[quoteIdx]}"
            </p>
          </div>
        )}

        {/* ── Inline Session Progress Indicator ───────────────────────────── */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">Session {focusCount + (sessionType === "focus" ? 1 : 0)}/{settings.longBreakInterval} until long break</span>
          <div className="flex gap-1 flex-1">
            {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  background: i < (sessionType === "focus" ? focusCount : focusCount)
                    ? sessionCfg.ringColor
                    : "var(--color-surface-container-high)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Settings Panel ───────────────────────────────────────────────── */}
        {showSettings && (
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 space-y-5">
            <h2 className="text-base font-semibold text-on-surface">Timer Settings</h2>

            {/* Duration sliders */}
            <div className="space-y-4">
              {[
                { key: "focusDuration" as const, label: "Focus Time", min: 1, max: 180, unit: "min" },
                { key: "shortBreak" as const, label: "Short Break", min: 1, max: 60, unit: "min" },
                { key: "longBreak" as const, label: "Long Break", min: 1, max: 90, unit: "min" },
                { key: "longBreakInterval" as const, label: "Sessions before long break", min: 2, max: 8, unit: "" },
              ].map(({ key, label, min, max, unit }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-sm text-on-surface font-medium">{label}</label>
                    <span className="text-sm font-bold text-primary">{settings[key]}{unit}</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={settings[key] as number}
                    onChange={(e) => updateDuration(key, parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                    aria-label={label}
                  />
                  <div className="flex justify-between text-[10px] text-on-surface-variant mt-0.5">
                    <span>{min}{unit}</span><span>{max}{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-outline-variant/30">
              {[
                { key: "autoStartBreak" as const, label: "Auto-start Break", icon: "coffee" },
                { key: "autoStartFocus" as const, label: "Auto-start Focus", icon: "play_circle" },
                { key: "soundEnabled" as const, label: "Alarm Sound", icon: "volume_up" },
                { key: "showAnimation" as const, label: "Timer Animation", icon: "animation" },
                { key: "notificationsEnabled" as const, label: "Browser Notifications", icon: "notifications" },
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>
                    <span className="text-sm text-on-surface">{label}</span>
                  </div>
                  <button
                    role="switch"
                    aria-checked={settings[key] as boolean}
                    aria-label={label}
                    onClick={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? "bg-primary" : "bg-surface-container-high"}`}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                      style={{ transform: settings[key] ? "translateX(20px)" : "translateX(0)" }}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Volume slider */}
            {settings.soundEnabled && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm text-on-surface font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">volume_up</span>
                    Alarm Volume
                  </label>
                  <span className="text-sm font-bold text-primary">{Math.round(settings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume}
                  onChange={(e) => setSettings((s) => ({ ...s, volume: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                  aria-label="Alarm volume"
                />
              </div>
            )}

            {/* Test sound button */}
            {settings.soundEnabled && (
              <button
                onClick={() => playAlarmSound(settings.volume)}
                className="w-full py-2 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">music_note</span>
                Test Alarm Sound
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
