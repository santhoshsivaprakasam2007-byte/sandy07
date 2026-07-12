"use client";

import { useState } from "react";
import Link from "next/link";
import { useStudyData, formatMinutes } from "@/lib/useStudyData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Mini bar chart (CSS only) ─────────────────────────────────────────────────

function BarChart({
  data,
  colorClass = "bg-primary",
}: {
  data: { label: string; minutes: number }[];
  colorClass?: string;
}) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {data.map((bar, i) => {
        const pct = Math.round((bar.minutes / max) * 100);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full flex flex-col justify-end" style={{ height: "96px" }}>
              {bar.minutes > 0 && (
                <div className="text-[9px] text-center text-primary font-semibold mb-0.5">
                  {bar.minutes >= 60
                    ? `${Math.floor(bar.minutes / 60)}h`
                    : `${bar.minutes}m`}
                </div>
              )}
              <div
                className={`w-full rounded-t-md transition-all ${
                  bar.minutes > 0 ? colorClass : "bg-surface-container-high"
                }`}
                style={{ height: `${Math.max(pct, bar.minutes > 0 ? 8 : 3)}%` }}
              />
            </div>
            <span className="text-[10px] text-on-surface-variant truncate w-full text-center">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Heatmap (4 weeks × 7 days) ────────────────────────────────────────────────

function Heatmap({ sessions }: { sessions: any[] }) {
  const cells = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (27 - i));
    const mins = sessions
      .filter(
        (s) =>
          s.session_type === "focus" &&
          s.completed &&
          new Date(s.created_at).toDateString() === d.toDateString()
      )
      .reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0);
    return { date: d, mins };
  });

  const max = Math.max(...cells.map((c) => c.mins), 1);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-[9px] text-center text-on-surface-variant">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const opacity =
            cell.mins === 0 ? 0 : Math.max(0.2, cell.mins / max);
          const isToday =
            cell.date.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              title={`${cell.date.toDateString()}: ${cell.mins}m`}
              className={`h-5 w-full rounded-sm border ${
                isToday
                  ? "border-primary"
                  : "border-outline-variant/20"
              } ${cell.mins > 0 ? "bg-primary" : "bg-surface-container"}`}
              style={{ opacity: cell.mins > 0 ? opacity : 1 }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-on-surface-variant mt-1">
        <span>4 weeks ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Stats() {
  const { sessions, derived, isLoading } = useStudyData();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const recentSessions = sessions.slice(0, 15);
  const isEmpty = derived.totalSessions === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-4">
        <span className="material-symbols-outlined text-7xl text-primary/30">
          bar_chart
        </span>
        <h2 className="text-2xl font-bold">No sessions yet</h2>
        <p className="text-muted-foreground">
          Complete your first focus session in the Timer to start generating
          insights and analytics about your study habits.
        </p>
        <Link
          href="/timer"
          className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
        >
          Start a Focus Session
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">
          Statistics & Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Deep dive into your study habits and productivity trends.
        </p>
      </div>

      {/* ── Hero Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Focus",
            value: formatMinutes(derived.totalFocusMinutes),
            icon: "schedule",
            sub: "all time",
          },
          {
            label: "Productivity Score",
            value: `${derived.productivityScore}/100`,
            icon: "speed",
            sub: "based on daily goal",
          },
          {
            label: "This Month",
            value: formatMinutes(derived.monthMinutes),
            icon: "calendar_month",
            sub: "last 30 days",
          },
          {
            label: "Today",
            value: formatMinutes(derived.todayMinutes),
            icon: "today",
            sub: `${derived.todaySessions} session(s)`,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="glass-card rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-on-surface-variant uppercase tracking-wide font-medium">
                {c.label}
              </span>
              <span className="material-symbols-outlined text-primary text-[18px]">
                {c.icon}
              </span>
            </div>
            <div className="text-2xl font-bold text-on-surface">{c.value}</div>
            <div className="text-xs text-on-surface-variant">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Streak & Insights ────────────────────────────────────────── */}
      <div className="grid md:grid-cols-12 gap-4">
        {/* Consistency Engine */}
        <div className="md:col-span-6 lg:col-span-4 glass-card p-6 rounded-xl border border-outline-variant/30 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="z-10 relative">
            <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-2">
              Consistency Engine
            </p>
            <div className="flex items-end gap-3 mb-3">
              <h2 className="text-4xl font-bold text-on-surface">
                {derived.currentStreak}
              </h2>
              <span className="text-xl text-on-surface-variant mb-1">
                day streak
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="material-symbols-outlined text-secondary text-[36px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <p className="text-sm text-on-surface-variant">
                Longest:{" "}
                <span className="font-bold text-on-surface">
                  {derived.longestStreak} days
                </span>
              </p>
            </div>
            <Heatmap sessions={sessions} />
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="md:col-span-6 lg:col-span-4 glass-card p-6 rounded-xl border border-outline-variant/30 bg-secondary/5 flex flex-col gap-4">
          <p className="text-xs text-secondary uppercase tracking-widest font-semibold mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">psychology</span> Insights
          </p>
          
          <div className="space-y-4 flex-grow">
            <div>
              <div className="text-xs text-on-surface-variant mb-1 uppercase font-medium">Best Study Day</div>
              <div className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">emoji_events</span> {derived.bestStudyDay}
              </div>
            </div>
            <div className="border-t border-outline-variant/20 pt-3">
              <div className="text-xs text-on-surface-variant mb-1 uppercase font-medium">Most Productive Hour</div>
              <div className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bolt</span> {derived.mostProductiveHour}
              </div>
            </div>
            <div className="border-t border-outline-variant/20 pt-3">
              <div className="text-xs text-on-surface-variant mb-1 uppercase font-medium">Task Completion Rate</div>
              <div className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">task_alt</span> 
                {derived.totalTasks > 0 ? Math.round((derived.completedTasks / derived.totalTasks) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Session Stats */}
        <div className="md:col-span-12 lg:col-span-4 bg-primary text-white p-6 rounded-xl shadow-lg flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-sm opacity-80 uppercase tracking-wide">
              Session Stats
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{derived.totalSessions}</div>
              <div className="text-xs opacity-70">Total sessions</div>
            </div>
            <div className="border-t border-white/20 pt-3">
              <div className="text-2xl font-bold">
                {formatMinutes(derived.avgSessionMinutes)}
              </div>
              <div className="text-xs opacity-70">Avg session length</div>
            </div>
            <div className="border-t border-white/20 pt-3">
              <div className="text-2xl font-bold">
                {formatMinutes(derived.longestSessionMinutes)}
              </div>
              <div className="text-xs opacity-70">Longest session</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts with Tabs ─────────────────────────────────────────────── */}
      <Card className="border-outline-variant/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Productivity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="mb-4 bg-surface-container">
              <TabsTrigger value="daily">Daily (Last 7 Days)</TabsTrigger>
              <TabsTrigger value="weekly">Weekly (Last 4 Weeks)</TabsTrigger>
              <TabsTrigger value="monthly">Monthly (Last 12 Months)</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="animate-in fade-in">
              <BarChart data={derived.last7Days} colorClass="bg-primary" />
            </TabsContent>
            <TabsContent value="weekly" className="animate-in fade-in">
              <BarChart data={derived.last4Weeks} colorClass="bg-secondary" />
            </TabsContent>
            <TabsContent value="monthly" className="animate-in fade-in">
              <BarChart data={derived.last12Months} colorClass="bg-[#8127cf]" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Recent Sessions ──────────────────────────────────────────── */}
      <div className="glass-card rounded-xl border border-outline-variant/30 p-5">
        <h3 className="font-semibold text-on-surface mb-1">Recent Sessions</h3>
        <p className="text-xs text-on-surface-variant mb-4">
          Your latest focus logs — newest first
        </p>
        {recentSessions.length === 0 ? (
          <div className="flex items-center justify-center h-24 opacity-50 text-sm">
            No sessions recorded yet
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => {
              const d = new Date(s.created_at);
              const isToday =
                new Date().toDateString() === d.toDateString();
              const timeStr = isToday
                ? `Today · ${d.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : d.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
              const typeLabel =
                s.session_type === "focus"
                  ? "Focus"
                  : s.session_type === "short_break"
                  ? "Short Break"
                  : "Long Break";
              const typeColor =
                s.session_type === "focus"
                  ? "text-primary bg-primary/10"
                  : "text-[#00685d] bg-[#00685d]/10";
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 py-2.5 border-b border-outline-variant/20 last:border-0"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeColor}`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {s.session_type === "focus" ? "psychology" : "coffee"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.subject || "Focus Session"}
                    </p>
                    <p className="text-xs text-on-surface-variant">{timeStr}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                      {typeLabel}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {s.duration_minutes}m
                    </span>
                    {s.completed && (
                      <span className="material-symbols-outlined text-green-500 text-[16px]">
                        check_circle
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
