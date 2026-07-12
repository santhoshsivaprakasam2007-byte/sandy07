"use client";

import { useState } from "react";
import Link from "next/link";
import { useStudyData, formatMinutes } from "@/lib/useStudyData";
import { createClient } from "@/utils/supabase/client";

export default function Planner() {
  const { tasks, isLoading, refresh, userId } = useStudyData();
  const supabase = createClient();

  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    subject: "",
    study_goal_minutes: 0,
    priority: "Med Priority",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  // ── Toggle complete ────────────────────────────────────────────
  const toggleTask = async (id: number, current: boolean) => {
    await supabase
      .from("tasks")
      .update({ completed: !current })
      .eq("id", id);
    refresh();
  };

  // ── Delete task ────────────────────────────────────────────────
  const deleteTask = async (id: number) => {
    setDeletingId(id);
    await supabase.from("tasks").delete().eq("id", id);
    refresh();
    setDeletingId(null);
  };

  // ── Add task ───────────────────────────────────────────────────
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !userId) return;
    setIsSubmitting(true);
    await supabase.from("tasks").insert([{
      user_id: userId,
      title: newTask.title,
      subject: newTask.subject || "General",
      study_goal_minutes: newTask.study_goal_minutes || 0,
      priority: newTask.priority,
      completed: false,
      study_minutes: 0,
    }]);
    setNewTask({ title: "", subject: "", study_goal_minutes: 0, priority: "Med Priority" });
    setIsAdding(false);
    setIsSubmitting(false);
    refresh();
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const priorityColor = (p: string) => {
    if (p?.includes("High")) return "text-red-500 bg-red-500/10";
    if (p?.includes("Low")) return "text-blue-500 bg-blue-500/10";
    return "text-yellow-600 bg-yellow-500/10";
  };

  // ── Task Card ──────────────────────────────────────────────────
  const TaskCard = ({ task }: { task: any }) => {
    const progress =
      task.study_goal_minutes > 0
        ? Math.min(100, Math.round((task.study_minutes / task.study_goal_minutes) * 100))
        : 0;

    return (
      <div
        className={`glass-card flex items-start p-4 rounded-xl border gap-3 transition-all group ${
          task.completed
            ? "bg-surface-container-low border-transparent opacity-60"
            : "border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40"
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={() => toggleTask(task.id, task.completed)}
          className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
            task.completed
              ? "border-primary bg-primary text-white"
              : "border-outline-variant hover:border-primary"
          }`}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed && (
            <span className="material-symbols-outlined text-[14px]">check</span>
          )}
        </button>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`font-medium text-sm ${
                task.completed
                  ? "line-through text-on-surface-variant"
                  : "text-on-surface"
              }`}
            >
              {task.title}
            </h4>
            {task.priority && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            )}
          </div>

          {task.subject && task.subject !== "General" && (
            <p className="text-xs text-on-surface-variant mt-0.5">{task.subject}</p>
          )}

          {/* Study progress */}
          {task.study_goal_minutes > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                <span>
                  {formatMinutes(task.study_minutes)} /{" "}
                  {formatMinutes(task.study_goal_minutes)}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container-high">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    progress >= 100 ? "bg-green-500" : "bg-primary"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {task.study_minutes > 0 && task.study_goal_minutes === 0 && (
            <p className="text-[10px] text-on-surface-variant mt-1">
              {formatMinutes(task.study_minutes)} studied
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          {/* Start timer with this task */}
          {!task.completed && (
            <Link
              href="/timer"
              title="Focus on this task"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">timer</span>
            </Link>
          )}
          <button
            onClick={() => deleteTask(task.id)}
            disabled={deletingId === task.id}
            title="Delete task"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              {deletingId === task.id ? "hourglass_empty" : "delete"}
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Study Planner
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Stay on track with your academic momentum
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {pending.length} remaining
          </span>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Task
          </button>
        </div>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <form
          onSubmit={handleAddTask}
          className="glass-card p-5 rounded-xl border border-primary/40 shadow-md space-y-3 animate-in slide-in-from-top-2 duration-200"
        >
          <h3 className="font-semibold text-on-surface text-sm">New Task</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">
                Task Title *
              </label>
              <input
                type="text"
                autoFocus
                required
                placeholder="What do you need to study?"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Mathematics, Physics"
                value={newTask.subject}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, subject: e.target.value }))
                }
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">
                Study Goal (minutes, optional)
              </label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 60"
                value={newTask.study_goal_minutes || ""}
                onChange={(e) =>
                  setNewTask((p) => ({
                    ...p,
                    study_goal_minutes: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, priority: e.target.value }))
                }
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option>High Priority</option>
                <option>Med Priority</option>
                <option>Low Priority</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? "Adding…" : "Add Task"}
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {tasks.length === 0 && !isAdding && (
        <div className="w-full border-2 border-dashed border-outline-variant rounded-xl p-12 flex flex-col items-center justify-center text-center opacity-70">
          <span className="material-symbols-outlined text-5xl mb-3 text-primary/50">
            event_note
          </span>
          <h3 className="font-semibold text-on-surface mb-2">
            Your planner is empty
          </h3>
          <p className="text-sm text-on-surface-variant mb-5 max-w-sm">
            Create your first study plan to start tracking your progress!
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Create your first task
          </button>
        </div>
      )}

      {/* Pending Tasks */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
            Pending ({pending.length})
          </h2>
          {pending.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
            Completed ({completed.length})
          </h2>
          {completed.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* FAB on mobile */}
      {!isAdding && tasks.length > 0 && (
        <button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-primary text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 md:hidden"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      )}
    </div>
  );
}
