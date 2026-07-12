"use client";

import { UserAchievement } from "@/lib/useStudyData";

const BADGES = [
  { id: "first_session", name: "First Session", description: "Completed your first focus session.", icon: "emoji_events", color: "text-yellow-500 bg-yellow-500/10" },
  { id: "1h_focus", name: "1 Hour Focus", description: "Reached 1 hour of total focus time.", icon: "hourglass_top", color: "text-blue-500 bg-blue-500/10" },
  { id: "5h_focus", name: "5 Hour Focus", description: "Reached 5 hours of total focus time.", icon: "workspace_premium", color: "text-purple-500 bg-purple-500/10" },
  { id: "7d_streak", name: "7-Day Streak", description: "Maintained a 7-day study streak.", icon: "local_fire_department", color: "text-orange-500 bg-orange-500/10" },
  { id: "30d_streak", name: "30-Day Streak", description: "Maintained a 30-day study streak.", icon: "diamond", color: "text-cyan-500 bg-cyan-500/10" },
  { id: "100_sessions", name: "Centurion", description: "Completed 100 focus sessions.", icon: "military_tech", color: "text-red-500 bg-red-500/10" },
];

export function AchievementsGrid({ achievements }: { achievements: UserAchievement[] }) {
  const unlockedIds = new Set(achievements.map(a => a.badge_id));

  return (
    <div className="glass-card p-5 rounded-xl border border-outline-variant/30">
      <h3 className="font-semibold text-on-surface mb-1">Achievements</h3>
      <p className="text-xs text-on-surface-variant mb-4">Badges earned through consistency</p>
      
      <div className="grid grid-cols-2 gap-3">
        {BADGES.map(badge => {
          const isUnlocked = unlockedIds.has(badge.id);
          return (
            <div 
              key={badge.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isUnlocked 
                  ? "border-outline-variant/30 bg-surface shadow-sm" 
                  : "border-transparent bg-surface-container/50 opacity-60 grayscale"
              }`}
              title={badge.description}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? badge.color : "bg-surface-container text-on-surface-variant"}`}>
                <span className="material-symbols-outlined text-[20px]">{badge.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-on-surface truncate">{badge.name}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{isUnlocked ? "Unlocked!" : "Locked"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
