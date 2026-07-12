"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useStudyData, formatMinutes, type Task } from "@/lib/useStudyData";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Planner() {
  const { tasks, isLoading, refresh, userId } = useStudyData();
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("due_date_asc");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Derived Data ────────────────────────────────────────────────────────
  
  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category).filter(Boolean));
    return ["All", ...Array.from(cats)] as string[];
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by Category
    if (filterCategory !== "All") {
      result = result.filter(t => t.category === filterCategory);
    }

    // Filter by Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "priority") {
        const pMap: any = { "High Priority": 1, "Med Priority": 2, "Low Priority": 3 };
        return (pMap[a.priority] || 4) - (pMap[b.priority] || 4);
      }
      // created_desc
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [tasks, search, filterCategory, sortBy]);

  const pending = filteredAndSortedTasks.filter((t) => !t.completed);
  const completed = filteredAndSortedTasks.filter((t) => t.completed);

  // ── Actions ─────────────────────────────────────────────────────────────

  const openNewTaskModal = () => {
    setEditingTask(null);
    setFormData({ title: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !userId) return;
    setIsSubmitting(true);

    const payload = {
      user_id: userId,
      title: formData.title,
    };

    let error: any;
    if (editingTask) {
      const { error: err } = await supabase.from("tasks").update(payload).eq("id", editingTask.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("tasks").insert([payload]);
      error = err;
    }

    if (error) {
      console.log("\n\n=== SUPABASE ERROR MESSAGE ===");
      console.log(error.message);
      console.log("==============================\n\n");
      toast.error(`Error saving task: ${error.message || "Unknown error"}. Did you run the SQL migration script?`);
    } else {
      toast.success(editingTask ? "Task updated" : "Task created");
      setIsModalOpen(false);
      refresh();
    }
    setIsSubmitting(false);
  };

  const toggleTask = async (id: number, current: boolean) => {
    await supabase.from("tasks").update({ completed: !current }).eq("id", id);
    refresh();
  };

  const deleteTask = async (id: number) => {
    setDeletingId(id);
    await supabase.from("tasks").delete().eq("id", id);
    toast.success("Task deleted");
    refresh();
    setDeletingId(null);
  };

  const priorityColor = (p: string) => {
    if (p?.includes("High")) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (p?.includes("Low")) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    return "text-yellow-600 bg-yellow-500/10 border-yellow-500/20";
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Components ──────────────────────────────────────────────────────────

  const TaskCard = ({ task }: { task: Task }) => {
    const progress = task.study_goal_minutes > 0
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
        <button
          onClick={() => toggleTask(task.id, task.completed)}
          className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
            task.completed
              ? "border-primary bg-primary text-white"
              : "border-outline-variant hover:border-primary"
          }`}
        >
          {task.completed && <span className="material-symbols-outlined text-[14px]">check</span>}
        </button>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className={`font-medium text-base ${task.completed ? "line-through text-on-surface-variant" : "text-on-surface"}`}>
              {task.title}
            </h4>
            {task.priority && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColor(task.priority)}`}>
                {task.priority.replace(" Priority", "")}
              </span>
            )}
            {task.category && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                {task.category}
              </span>
            )}
          </div>

          {(task.subject || task.notes) && (
            <div className="flex flex-col gap-1 mt-2 mb-3">
              {task.subject && (
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">book</span> {task.subject}
                </div>
              )}
              {task.notes && (
                <div className="text-xs text-on-surface-variant mt-1 border-l-2 border-outline-variant/30 pl-2 italic truncate">
                  {task.notes}
                </div>
              )}
            </div>
          )}

          {task.study_goal_minutes > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-on-surface-variant mb-1 font-medium">
                <span>{formatMinutes(task.study_minutes)} / {formatMinutes(task.study_goal_minutes)}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className={`h-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {task.study_minutes > 0 && task.study_goal_minutes === 0 && (
            <p className="text-[10px] font-medium text-primary mt-2">
              {formatMinutes(task.study_minutes)} studied
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
            onClick={() => openEditModal(task)}
            title="Edit task"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
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
    <div className="space-y-6 pb-20 relative min-h-[80vh]">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Study Planner</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Manage tasks and track your academic progress</p>
        </div>
        <Button onClick={openNewTaskModal} className="gap-2 shadow-lg shadow-primary/20 rounded-xl">
          <span className="material-symbols-outlined text-[18px]">add_task</span> Add Task
        </Button>
      </div>

      {/* Toolbar: Search, Filter, Sort */}
      {tasks.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">search</span>
            <Input 
              placeholder="Search tasks, subjects, notes..." 
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-surface-container"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-md px-3 py-2 text-sm outline-none"
            >
              {categories.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
            </select>
            <select 
              value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-md px-3 py-2 text-sm outline-none"
            >
              <option value="priority">Priority (High to Low)</option>
              <option value="created_desc">Recently Added</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty States */}
      {tasks.length === 0 && (
        <div className="w-full border-2 border-dashed border-outline-variant rounded-2xl p-12 flex flex-col items-center justify-center text-center opacity-80 mt-10">
          <span className="material-symbols-outlined text-6xl mb-4 text-primary/40">assignment</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">Your planner is empty</h3>
          <p className="text-sm text-on-surface-variant mb-6 max-w-sm">
            Create your first study task to start organizing your academic life.
          </p>
          <Button onClick={openNewTaskModal} size="lg" className="rounded-full">Create Task</Button>
        </div>
      )}

      {tasks.length > 0 && pending.length === 0 && completed.length === 0 && (
        <div className="text-center py-10 opacity-70">
          <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
          <p>No tasks match your search filters.</p>
        </div>
      )}

      {/* Pending Tasks */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider pl-1">
            Pending Tasks ({pending.length})
          </h2>
          {pending.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      )}

      {/* Completed Tasks */}
      {completed.length > 0 && (
        <div className="space-y-3 mt-8">
          <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider pl-1">
            Completed ({completed.length})
          </h2>
          {completed.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      )}

      {/* Task Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-background max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col animate-in zoom-in-95 duration-200"
            style={{ width: "95vw", maxWidth: "550px" }}
          >
            
            <div className="flex justify-between items-center p-5 border-b border-outline-variant/20 sticky top-0 bg-surface z-10">
              <h2 className="text-lg font-bold">{editingTask ? "Edit Task" : "New Task"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="p-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Task Title *</label>
                <Input required autoFocus placeholder="Read Chapter 4..." value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="text-base py-6" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Task"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB for Mobile */}
      <button
        onClick={openNewTaskModal}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-primary text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

    </div>
  );
}
