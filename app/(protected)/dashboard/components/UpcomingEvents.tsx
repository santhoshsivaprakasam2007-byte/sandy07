"use client";

import { useStudyData } from "@/lib/useStudyData";
import Link from "next/link";
import { format, isAfter, startOfDay } from "date-fns";

export function UpcomingEvents() {
  const { unifiedEvents } = useStudyData();

  // Show upcoming events in the next 7 days
  const today = startOfDay(new Date());
  
  const upcoming = unifiedEvents
    .filter(e => isAfter(e.date, today) || e.date.getTime() === today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5); // top 5

  return (
    <div className="glass-card p-5 rounded-xl border border-outline-variant/30 flex-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-on-surface">Upcoming Schedule</h3>
        <Link href="/calendar" className="text-xs font-semibold text-primary hover:underline">
          Full Calendar
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-on-surface-variant opacity-60">
          <span className="material-symbols-outlined text-3xl mb-1">event_available</span>
          <span className="text-sm">No upcoming events</span>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(e => (
            <div key={e.id} className="flex gap-3 p-3 rounded-lg border border-outline-variant/20 transition-colors">
              <div 
                className="w-1.5 rounded-full shrink-0" 
                style={{ backgroundColor: e.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-on-surface truncate">{e.title}</p>
                <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant">
                  <span className="capitalize">{e.type}</span>
                  <span>{format(e.date, "MMM d")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
