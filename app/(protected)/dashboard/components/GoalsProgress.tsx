"use client";

import { formatMinutes } from "@/lib/useStudyData";

interface GoalsProps {
  goals: any;
  derived: any;
}

export function GoalsProgress({ goals, derived }: GoalsProps) {
  if (!goals) return null;

  const dailyProgress = Math.min(100, (derived.todayMinutes / goals.daily_minutes) * 100);
  const weeklyProgress = Math.min(100, (derived.weekMinutes / goals.weekly_minutes) * 100);
  const monthlyProgress = Math.min(100, (derived.monthMinutes / goals.monthly_minutes) * 100);

  const GoalBar = ({ label, current, target, progress, color }: any) => (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span className="text-on-surface">{label}</span>
        <span className="text-on-surface-variant">
          {formatMinutes(current)} / {formatMinutes(target)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-[10px] text-right mt-0.5 text-on-surface-variant">
        {Math.round(progress)}%
      </div>
    </div>
  );

  return (
    <div className="glass-card p-5 rounded-xl border border-outline-variant/30">
      <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">flag</span>
        Study Goals
      </h3>
      <GoalBar
        label="Daily Goal"
        current={derived.todayMinutes}
        target={goals.daily_minutes}
        progress={dailyProgress}
        color={dailyProgress >= 100 ? "bg-green-500" : "bg-blue-500"}
      />
      <GoalBar
        label="Weekly Goal"
        current={derived.weekMinutes}
        target={goals.weekly_minutes}
        progress={weeklyProgress}
        color={weeklyProgress >= 100 ? "bg-green-500" : "bg-primary"}
      />
      <GoalBar
        label="Monthly Goal"
        current={derived.monthMinutes}
        target={goals.monthly_minutes}
        progress={monthlyProgress}
        color={monthlyProgress >= 100 ? "bg-green-500" : "bg-purple-500"}
      />
    </div>
  );
}
