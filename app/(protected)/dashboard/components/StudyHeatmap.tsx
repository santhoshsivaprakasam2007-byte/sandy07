"use client";

import { subDays, startOfDay, isSameDay } from "date-fns";
import { StudySession } from "@/lib/useStudyData";

export function StudyHeatmap({ sessions }: { sessions: StudySession[] }) {
  // Generate last 90 days
  const today = startOfDay(new Date());
  
  const days = Array.from({ length: 90 }, (_, i) => {
    const d = subDays(today, 89 - i);
    const daySessions = sessions.filter(s => s.session_type === "focus" && s.completed && isSameDay(new Date(s.created_at), d));
    const mins = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    return { date: d, mins };
  });

  const maxMins = Math.max(...days.map(d => d.mins), 1);

  const getIntensityClass = (mins: number) => {
    if (mins === 0) return "bg-surface-container border-outline-variant/20";
    const ratio = mins / maxMins;
    if (ratio < 0.25) return "bg-primary/30 border-primary/20";
    if (ratio < 0.5) return "bg-primary/50 border-primary/40";
    if (ratio < 0.75) return "bg-primary/75 border-primary/60";
    return "bg-primary border-primary";
  };

  return (
    <div className="glass-card p-5 rounded-xl border border-outline-variant/30 overflow-hidden">
      <h3 className="font-semibold text-on-surface mb-2">Contribution Heatmap</h3>
      <p className="text-xs text-on-surface-variant mb-4">Last 90 days of study activity</p>
      
      <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
        {/* We can organize into weeks (columns) for a true github style, but a long wrapping flex works too. Let's do a wrapping flex container for simplicity on all screen sizes, or a grid */}
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {days.map((day, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-sm border ${getIntensityClass(day.mins)} transition-colors`}
              title={`${day.date.toDateString()}: ${day.mins} mins`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 text-[10px] text-on-surface-variant">
        <span>3 months ago</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-surface-container" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/50" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/75" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
