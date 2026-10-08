"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, Project } from "@/services/dataService";
import { ProjectModal } from "@/components/project-modal";
import { ProjectDetailsModal } from "@/components/project-details-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";
import { SearchableSelect, SelectOption } from "@/components/searchable-select";

type ProjectColumn = "Planning" | "In Progress" | "Review" | "Completed";

const KANBAN_COLUMNS: { id: ProjectColumn; title: string; color: string; badgeBg: string }[] = [
  { id: "Planning", title: "Planning", color: "border-amber-200 bg-amber-500/10 text-amber-800", badgeBg: "bg-amber-100 text-amber-800" },
  { id: "In Progress", title: "In Progress", color: "border-blue-200 bg-blue-500/10 text-blue-800", badgeBg: "bg-blue-100 text-blue-800" },
  { id: "Review", title: "Review & QA", color: "border-purple-200 bg-purple-500/10 text-purple-800", badgeBg: "bg-purple-100 text-purple-800" },
  { id: "Completed", title: "Completed", color: "border-emerald-200 bg-emerald-500/10 text-emerald-800", badgeBg: "bg-emerald-100 text-emerald-800" },
];

export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await DataService.getProjects();
      setProjects(data);
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

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesQuery =
        !query.trim() ||
        `${p.name} ${p.client} ${p.manager} ${p.assignedTeam} ${p.description}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesPriority = priorityFilter === "ALL" || p.priority === priorityFilter;

      return matchesQuery && matchesPriority;
    });
  }, [projects, query, priorityFilter]);

  // Group projects by Kanban columns
  const columnProjects = useMemo(() => {
    const map: Record<ProjectColumn, Project[]> = {
      Planning: [],
      "In Progress": [],
      Review: [],
      Completed: [],
    };

    filteredProjects.forEach((p) => {
      const statusKey = p.status as ProjectColumn;
      if (map[statusKey]) {
        map[statusKey].push(p);
      } else {
        // Fallback for unexpected statuses like "On Hold"
        map.Planning.push(p);
      }
    });

    return map;
  }, [filteredProjects]);

  // Persist status change to Supabase via RPC
  const handleStatusChange = async (projectId: string, newStatus: ProjectColumn) => {
    setMovingProjectId(projectId);
    try {
      const progress = newStatus === "Completed" ? 100 : newStatus === "Review" ? 85 : newStatus === "In Progress" ? 45 : 15;
      await DataService.updateProjectStatus(projectId, newStatus, progress);
      toast.success(`Project moved to "${newStatus}".`);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus, progress } : p))
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update project status in Supabase.");
    } finally {
      setMovingProjectId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    try {
      const success = await DataService.deleteProject(deletingProject.id);
      if (success) {
        toast.success(`Project "${deletingProject.name}" deleted successfully.`);
        setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      } else {
        toast.error("Failed to delete project.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete project.");
    } finally {
      setDeletingProject(null);
    }
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Projects"
        subtitle="Manage client initiatives, roadmaps, deliverables, and team ownership."
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 shadow-sm transition"
          >
            <span>+</span>
            <span>Add Project</span>
          </button>
        }
      >
        <div className="space-y-6">
          {/* Controls: Search and Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects by name, client, or team..."
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
                  placeholder="All Priorities"
                  options={[
                    { value: "ALL", label: "All Priorities" },
                    { value: "High", label: "High Priority" },
                    { value: "Medium", label: "Medium Priority" },
                    { value: "Low", label: "Low Priority" },
                  ] as SelectOption[]}
                  value={priorityFilter}
                  onChange={(val: string) => setPriorityFilter(val ?? "ALL")}
                  isClearable={false}
                  className="w-44"
                />

                {(query || priorityFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setPriorityFilter("ALL");
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PART 4: KANBAN BOARD VIEW */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500 shadow-xs">
              Loading Project Pipeline...
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              title={query ? "No matching projects" : "No projects created"}
              description={
                query
                  ? "Try resetting your search query or adjusting your filters."
                  : "Start tracking deliverables and client milestones by creating your first project."
              }
              actionLabel="+ Add Project"
              onAction={() => setIsCreateOpen(true)}
              icon="📁"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
              {KANBAN_COLUMNS.map((col) => {
                const colItems = columnProjects[col.id];

                return (
                  <div
                    key={col.id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-xs min-h-[500px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-2 py-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                          {col.title}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${col.badgeBg}`}>
                          {colItems.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Cards */}
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                      {colItems.map((project) => (
                        <div
                          key={String(project.id)}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition space-y-3"
                        >
                          {/* Card Top: Client & Priority */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                              {project.client}
                            </span>
                            <StatusBadge status={project.priority} />
                          </div>

                          {/* Card Title */}
                          <h4
                            onClick={() => setViewingProject(project)}
                            className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition line-clamp-2"
                          >
                            {project.name}
                          </h4>

                          {project.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {project.description}
                            </p>
                          )}

                          {/* Progress Indicator */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Progress</span>
                              <span className="font-bold text-slate-700">{project.progress ?? 0}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${project.progress ?? 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Meta: Manager & Dates */}
                          <div className="border-t border-slate-100 pt-2.5 space-y-1 text-[11px] text-slate-500">
                            <div className="flex items-center justify-between">
                              <span>Lead:</span>
                              <span className="font-semibold text-slate-800">{project.manager}</span>
                            </div>
                            {project.dueDate && (
                              <div className="flex items-center justify-between">
                                <span>Due:</span>
                                <span className="font-medium text-slate-700">{project.dueDate}</span>
                              </div>
                            )}
                          </div>

                          {/* Interactive Status Movement & Actions */}
                          <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between gap-1">
                            {/* Quick Status Mover */}
                            <SearchableSelect
                              placeholder="Move to..."
                              options={[
                                { value: "Planning", label: "Move: Planning" },
                                { value: "In Progress", label: "Move: In Progress" },
                                { value: "Review", label: "Move: Review" },
                                { value: "Completed", label: "Move: Completed" },
                              ] as SelectOption[]}
                              value={project.status}
                              onChange={(val: string) => {
                                if (val && val !== project.status) {
                                  handleStatusChange(project.id, val as ProjectColumn);
                                }
                              }}
                              isDisabled={movingProjectId === project.id}
                              isClearable={false}
                              className="w-36"
                            />

                            {/* Card Menu Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingProject(project)}
                                title="View Details"
                                className="rounded-lg p-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                              >
                                👁️
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingProject(project)}
                                title="Edit Project"
                                className="rounded-lg p-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingProject(project)}
                                title="Delete Project"
                                className="rounded-lg p-1.5 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {colItems.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 italic">
                          No projects in {col.title}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create / Edit Project Modal */}
        <ProjectModal
          isOpen={isCreateOpen || Boolean(editingProject)}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingProject(null);
          }}
          projectToEdit={editingProject}
          onSaved={() => loadData()}
        />

        {/* View Project Details Modal */}
        <ProjectDetailsModal
          isOpen={Boolean(viewingProject)}
          onClose={() => setViewingProject(null)}
          project={viewingProject}
          onEdit={(proj) => setEditingProject(proj)}
          onDelete={(proj) => setDeletingProject(proj)}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deletingProject)}
          onClose={() => setDeletingProject(null)}
          onConfirm={handleDelete}
          title="Delete Project"
          message={`Are you sure you want to delete project "${deletingProject?.name}"? All roadmap data will be removed.`}
          confirmLabel="Delete Project"
        />
      </AppShell>
    </ProtectedPage>
  );
}
