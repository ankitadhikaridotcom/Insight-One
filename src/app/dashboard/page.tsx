"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, Task, ContentItem } from "@/services/dataService";
import { StatusBadge } from "@/components/status-badge";
import { ProjectModal } from "@/components/project-modal";
import { TaskModal } from "@/components/task-modal";
import { ContentModal } from "@/components/content-modal";
import { ClientModal } from "@/components/client-modal";
import { TaskDetailsModal } from "@/components/task-details-modal";
import { ContentDetailsModal } from "@/components/content-details-modal";
import { ConfirmModal } from "@/components/confirm-modal";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeEmployees: 0,
    pendingTasks: 0,
    contentInPipeline: 0,
    scheduledContent: 0,
    publishedContent: 0,
  });
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [pipelineItems, setPipelineItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick action modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Detail inspection modals
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingContent, setViewingContent] = useState<ContentItem | null>(null);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deletingContent, setDeletingContent] = useState<ContentItem | null>(null);

  const loadData = async () => {
    try {
      const [statsData, tasksData, contentData] = await Promise.all([
        DataService.getDashboardStats(),
        DataService.getTasks(),
        DataService.getContent(),
      ]);
      setStats(statsData);
      setUpcomingTasks(tasksData.slice(0, 5));
      setPipelineItems(contentData.slice(0, 5));
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

  return (
    <ProtectedPage>
      <AppShell
        title="Dashboard"
        subtitle="Performance overview across clients, teams, content pipeline, and deliverables."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <span>📊</span>
              <span>Performance Report</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
            >
              <span>+</span>
              <span>New Task</span>
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Quick Action Shortcuts Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                Workspace Quick Actions
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(true)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  + Add Project
                </button>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  + Add Client
                </button>
                <button
                  type="button"
                  onClick={() => setIsContentModalOpen(true)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  + New Content
                </button>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  + Create Task
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards (6 Live Application KPIs) */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "Total Clients", value: stats.totalClients, tone: "text-slate-900", href: "/clients" },
              { label: "Active Employees", value: stats.activeEmployees, tone: "text-blue-600", href: "/team" },
              { label: "Pending Tasks", value: stats.pendingTasks, tone: "text-amber-600", href: "/tasks" },
              { label: "Content in Pipeline", value: stats.contentInPipeline, tone: "text-purple-600", href: "/content" },
              { label: "Scheduled Content", value: stats.scheduledContent, tone: "text-cyan-600", href: "/content" },
              { label: "Published Content", value: stats.publishedContent, tone: "text-emerald-600", href: "/content" },
            ].map((metric) => (
              <Link
                key={metric.label}
                href={metric.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="text-xs font-medium text-slate-500">{metric.label}</div>
                <div className={`mt-4 text-3xl font-bold ${metric.tone}`}>
                  {loading ? "…" : metric.value}
                </div>
                <div className="mt-3 flex items-center text-[11px] font-semibold text-slate-400 group-hover:text-slate-700 transition">
                  <span>View details</span>
                  <span className="ml-1">→</span>
                </div>
              </Link>
            ))}
          </section>

          {/* Double Column: Upcoming Tasks and Content Pipeline */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Tasks Section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Upcoming Deliverables</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Assigned tasks requiring attention.</p>
                </div>
                <Link href="/tasks" className="text-xs font-semibold text-blue-600 hover:underline">
                  View all ({stats.pendingTasks}) →
                </Link>
              </div>

              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div
                      key={String(task.id)}
                      onClick={() => setViewingTask(task)}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 hover:bg-slate-50/50 transition cursor-pointer"
                    >
                      <div className="pr-3">
                        <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition">
                          {task.title}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>{task.client}</span>
                          <span>•</span>
                          <span>Assignee: {task.assignee}</span>
                          <span>•</span>
                          <span>Due: {task.dueDate}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <StatusBadge status={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                  No upcoming tasks. Click "+ Create Task" to add one.
                </div>
              )}
            </section>

            {/* Active Content Pipeline Section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Content Pipeline Snapshot</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Recent assets moving through the 8 stages.</p>
                </div>
                <Link href="/content" className="text-xs font-semibold text-blue-600 hover:underline">
                  Open board →
                </Link>
              </div>

              {pipelineItems.length > 0 ? (
                <div className="space-y-3">
                  {pipelineItems.map((item) => (
                    <div
                      key={String(item.id)}
                      onClick={() => setViewingContent(item)}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 hover:bg-slate-50/50 transition cursor-pointer"
                    >
                      <div className="pr-3">
                        <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition">
                          {item.title}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>{item.client}</span>
                          <span>•</span>
                          <span>{item.platform}</span>
                          <span>•</span>
                          <span>Lead: {item.assignee}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                  No content pipeline items yet. Click "+ New Content" to add.
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Modal shortcuts */}
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onSaved={() => loadData()}
        />

        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSaved={() => loadData()}
        />

        <ContentModal
          isOpen={isContentModalOpen}
          onClose={() => setIsContentModalOpen(false)}
          onSaved={() => loadData()}
        />

        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSaved={() => loadData()}
        />

        {/* Inspect Task Modal */}
        <TaskDetailsModal
          isOpen={Boolean(viewingTask)}
          onClose={() => setViewingTask(null)}
          task={viewingTask}
          onEdit={(t) => {
            setViewingTask(null);
            setEditingTask(t);
          }}
          onDelete={(t) => setDeletingTask(t)}
          onStatusChange={() => loadData()}
        />

        {/* Edit Task Modal */}
        <TaskModal
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
          taskToEdit={editingTask}
          onSaved={() => loadData()}
        />

        {/* Inspect Content Modal */}
        <ContentDetailsModal
          isOpen={Boolean(viewingContent)}
          onClose={() => setViewingContent(null)}
          content={viewingContent}
          onEdit={(c) => {
            setViewingContent(null);
            setEditingContent(c);
          }}
          onDelete={(c) => setDeletingContent(c)}
          onStageChange={() => loadData()}
        />

        {/* Edit Content Modal */}
        <ContentModal
          isOpen={Boolean(editingContent)}
          onClose={() => setEditingContent(null)}
          contentToEdit={editingContent}
          onSaved={() => loadData()}
        />

        {/* Delete confirmation modals */}
        <ConfirmModal
          isOpen={Boolean(deletingTask)}
          onClose={() => setDeletingTask(null)}
          onConfirm={async () => {
            if (deletingTask) {
              await DataService.deleteTask(deletingTask.id);
              setDeletingTask(null);
              await loadData();
            }
          }}
          title="Delete Task"
          message={`Are you sure you want to delete "${deletingTask?.title}"?`}
        />

        <ConfirmModal
          isOpen={Boolean(deletingContent)}
          onClose={() => setDeletingContent(null)}
          onConfirm={async () => {
            if (deletingContent) {
              await DataService.deleteContent(deletingContent.id);
              setDeletingContent(null);
              await loadData();
            }
          }}
          title="Delete Content Asset"
          message={`Are you sure you want to delete "${deletingContent?.title}"?`}
        />
      </AppShell>
    </ProtectedPage>
  );
}
