"use client";

import Link from "next/link";
import { useStudyData, formatMinutes } from "@/lib/useStudyData";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="h-4 bg-surface-container-high rounded w-24"></div>
        <div className="h-4 w-4 bg-surface-container-high rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-surface-container-high rounded w-16 mb-2"></div>
        <div className="h-3 bg-surface-container-high rounded w-32"></div>
      </CardContent>
    </Card>
  );
}

function BarChart({ data }: { data: { label: string; minutes: number }[] }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  return (
    <div className="flex items-end gap-2 h-40 w-full mt-4">
      {data.map((bar, i) => {
        const pct = Math.round((bar.minutes / max) * 100);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 group relative">
            <div className="w-full flex flex-col justify-end h-full">
              {bar.minutes > 0 && (
                <div className="text-[10px] text-center text-primary font-semibold mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 w-full">
                  {formatMinutes(bar.minutes)}
                </div>
              )}
              <div
                className={`w-full rounded-t-md transition-all ${
                  bar.minutes > 0 ? "bg-primary" : "bg-surface-container"
                }`}
                style={{ height: `${Math.max(pct, bar.minutes > 0 ? 5 : 2)}%` }}
              />
            </div>
            <span className="text-[10px] text-on-surface-variant truncate">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { sessions, tasks, derived, isLoading, refresh } = useStudyData();
  const [firstName, setFirstName] = useState("Student");

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata?.full_name) {
        setFirstName(data.user.user_metadata.full_name.split(" ")[0]);
      }
    });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-10 w-48 bg-surface-container-high animate-pulse rounded"></div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  const isBrandNew = sessions.length === 0 && tasks.length === 0;
  const recentSessions = sessions.slice(0, 5);
  const pendingTasks = tasks.filter(t => !t.completed).sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  }).slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      <section className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {firstName}!</h2>
          <p className="text-muted-foreground mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/timer">
            <Button className="gap-2"><span className="material-symbols-outlined text-sm">timer</span> Start Timer</Button>
          </Link>
          <button onClick={() => refresh()} className="p-2 border rounded hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </section>

          {/* Metrics Row */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Deep Work</CardTitle>
                <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMinutes(derived.totalFocusMinutes)}</div>
                <p className="text-xs text-muted-foreground mt-1">All-time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Today's Focus</CardTitle>
                <span className="material-symbols-outlined text-blue-500 text-[18px]">today</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMinutes(derived.todayMinutes)}</div>
                <p className="text-xs text-muted-foreground mt-1">{derived.todaySessions} sessions today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Sessions Done</CardTitle>
                <span className="material-symbols-outlined text-emerald-500 text-[18px]">task_alt</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{derived.totalSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">Avg {formatMinutes(derived.avgSessionMinutes)}/session</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <span className="material-symbols-outlined text-orange-500 text-[18px]">local_fire_department</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{derived.currentStreak} Days</div>
                <p className="text-xs text-muted-foreground mt-1">Longest: {derived.longestStreak} days</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Weekly Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={derived.last7Days} />
                <div className="mt-4 flex justify-between text-xs text-muted-foreground pt-4 border-t border-outline-variant/20">
                  <span>Total this week: <strong>{formatMinutes(derived.weekMinutes)}</strong></span>
                  <span>{derived.last7Days.reduce((acc, d) => acc + d.sessions, 0)} sessions</span>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle>Upcoming Tasks</CardTitle>
                <Link href="/planner" className="text-xs text-primary hover:underline">View all</Link>
              </CardHeader>
              <CardContent>
                {pendingTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                    <span className="material-symbols-outlined text-2xl mb-1">check_circle</span>
                    <span className="text-sm">All caught up!</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingTasks.map(t => (
                      <div key={t.id} className="flex gap-3">
                        <div className="w-1.5 rounded-full bg-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{t.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{t.priority} Priority • {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No due date'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
    </div>
  );
}
