"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, Task } from "@/services/dataService";
import { TaskModal } from "@/components/task-modal";
import { TaskDetailsModal } from "@/components/task-details-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";
import { SearchableSelect, SelectOption } from "@/components/searchable-select";

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filter state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const loadData = async () => {
    try {
      const data = await DataService.getTasks();
      setTasks(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener("insightone_storage_changed", handleStorageChange);
    window.addEventListener("insightone_supabase_changed", handleStorageChange);
    return () => {
      window.removeEventListener("insightone_storage_changed", handleStorageChange);
      window.removeEventListener("insightone_supabase_changed", handleStorageChange);
    };
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesQuery =
        !query.trim() ||
        `${task.title} ${task.assignee} ${task.client} ${task.description || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [tasks, query, statusFilter, priorityFilter]);

  const handleToggleCompleted = async (task: Task) => {
    const nextStatus = task.status === "Completed" ? "To Do" : "Completed";
    const updated = await DataService.updateTask(task.id, { status: nextStatus });
    if (updated) {
      toast.success(
        nextStatus === "Completed" ? `Marked "${task.title}" as completed` : `Reopened "${task.title}"`
      );
      await loadData();
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      const success = await DataService.deleteTask(deletingTask.id);
      if (success) {
        toast.success(`Task "${deletingTask.title}" deleted.`);
        setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      } else {
        toast.error("Failed to delete task.");
      }
    } catch {
      toast.error("Failed to delete task.");
    } finally {
      setDeletingTask(null);
    }
  };

  const hasActiveFilters = query.trim() !== "" || statusFilter !== "ALL" || priorityFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Tasks"
        subtitle="Track deliverables, priorities, deadlines, and client commitments."
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
          >
            <span>+</span>
            <span>Create Task</span>
          </button>
        }
      >
        <div className="space-y-6">
          {/* Controls: Search and Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks by title, employee, or client..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <SearchableSelect
                  placeholder="All Statuses"
                  options={[
                    { value: "ALL", label: "All Statuses" },
                    { value: "To Do", label: "To Do" },
                    { value: "In Progress", label: "In Progress" },
                    { value: "Blocked", label: "Blocked" },
                    { value: "Completed", label: "Completed" },
                  ] as SelectOption[]}
                  value={statusFilter}
                  onChange={(val: string) => setStatusFilter(val ?? "ALL")}
                  isClearable={false}
                  className="w-40"
                />

                <SearchableSelect
                  placeholder="All Priorities"
                  options={[
                    { value: "ALL", label: "All Priorities" },
                    { value: "High", label: "High" },
                    { value: "Medium", label: "Medium" },
                    { value: "Low", label: "Low" },
                  ] as SelectOption[]}
                  value={priorityFilter}
                  onChange={(val: string) => setPriorityFilter(val ?? "ALL")}
                  isClearable={false}
                  className="w-40"
                />

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">Loading tasks...</div>
            ) : filteredTasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold w-10">Done</th>
                      <th className="py-3.5 px-4 font-semibold">Task Title</th>
                      <th className="py-3.5 px-4 font-semibold">Assignee</th>
                      <th className="py-3.5 px-4 font-semibold">Client</th>
                      <th className="py-3.5 px-4 font-semibold">Priority</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Due Date</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map((task) => {
                      const isCompleted = task.status === "Completed";
                      return (
                        <tr
                          key={String(task.id)}
                          className="hover:bg-slate-50/70 transition cursor-pointer"
                          onClick={() => setViewingTask(task)}
                        >
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleToggleCompleted(task)}
                              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            <div className="flex flex-col">
                              <span className={`font-semibold ${isCompleted ? "line-through text-slate-400" : "text-slate-900"}`}>
                                {task.title}
                              </span>
                              {task.description && (
                                <span className="text-xs text-slate-400 line-clamp-1 max-w-sm">
                                  {task.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{task.assignee}</td>
                          <td className="py-3.5 px-4 text-slate-500">{task.client}</td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={task.priority} />
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-600">{task.dueDate}</td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingTask(task)}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTask(task)}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTask(task)}
                                className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title={hasActiveFilters ? "No matching tasks" : "No tasks found"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your search query or status filter."
                    : "Create a task to assign work and monitor delivery progress."
                }
                actionLabel={hasActiveFilters ? "Clear Filters" : "+ Create task"}
                onAction={hasActiveFilters ? clearFilters : () => setIsCreateOpen(true)}
                icon="✓"
              />
            )}
          </div>
        </div>

        {/* Create / Edit Task Modal */}
        <TaskModal
          isOpen={isCreateOpen || Boolean(editingTask)}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingTask(null);
          }}
          taskToEdit={editingTask}
          onSaved={() => loadData()}
        />

        {/* View Task Details Modal */}
        <TaskDetailsModal
          isOpen={Boolean(viewingTask)}
          onClose={() => setViewingTask(null)}
          task={viewingTask}
          onEdit={(t) => setEditingTask(t)}
          onDelete={(t) => setDeletingTask(t)}
          onStatusChange={() => loadData()}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deletingTask)}
          onClose={() => setDeletingTask(null)}
          onConfirm={handleDelete}
          title="Delete Task"
          message={`Are you sure you want to delete task "${deletingTask?.title}"?`}
          confirmLabel="Delete Task"
        />
      </AppShell>
    </ProtectedPage>
  );
}
