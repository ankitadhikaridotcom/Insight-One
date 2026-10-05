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

export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

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

      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || p.priority === priorityFilter;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [projects, query, statusFilter, priorityFilter]);

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

  const hasActiveFilters = query.trim() !== "" || statusFilter !== "ALL" || priorityFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
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
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
          >
            <span>+</span>
            <span>Add Project</span>
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

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

          {/* Projects Grid */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Loading projects...
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <div
                  key={String(project.id)}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                        {project.client}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={project.priority} />
                        <StatusBadge status={project.status} />
                      </div>
                    </div>

                    <h3
                      onClick={() => setViewingProject(project)}
                      className="mt-2 text-base font-semibold text-slate-900 group-hover:text-blue-600 transition cursor-pointer"
                    >
                      {project.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                      {project.description || "No project description provided."}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div>
                        Manager: <span className="font-medium text-slate-700">{project.manager}</span>
                      </div>
                      <div>
                        Due: <span className="font-medium text-slate-700">{project.dueDate}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => setViewingProject(project)}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        View Details →
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingProject(project)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProject(project)}
                          className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={hasActiveFilters ? "No matching projects" : "No projects found"}
              description={
                hasActiveFilters
                  ? "Try resetting your search query or adjusting your filters."
                  : "Start tracking deliverables and client milestones by creating your first project."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : "+ Add Project"}
              onAction={hasActiveFilters ? clearFilters : () => setIsCreateOpen(true)}
              icon="📁"
            />
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
          onEdit={(p) => setEditingProject(p)}
          onDelete={(p) => setDeletingProject(p)}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deletingProject)}
          onClose={() => setDeletingProject(null)}
          onConfirm={handleDelete}
          title="Delete Project"
          message={`Are you sure you want to delete "${deletingProject?.name}"? All associated task associations will remain intact.`}
          confirmLabel="Delete Project"
        />
      </AppShell>
    </ProtectedPage>
  );
}
