"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, ContentItem, ContentStage, CONTENT_STAGES } from "@/services/dataService";
import { ContentModal } from "@/components/content-modal";
import { ContentDetailsModal } from "@/components/content-details-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";

export default function ContentPage() {
  const { toast } = useToast();
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [stageForNewContent, setStageForNewContent] = useState<ContentStage>("Idea");
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);

  const loadData = async () => {
    try {
      const data = await DataService.getContent();
      setContentList(data);
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

  const platforms = useMemo(() => {
    return Array.from(new Set(contentList.map((c) => c.platform).filter(Boolean)));
  }, [contentList]);

  const filteredContent = useMemo(() => {
    return contentList.filter((item) => {
      const matchesQuery =
        !query.trim() ||
        `${item.title} ${item.client} ${item.assignee} ${item.platform} ${item.description || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesPlatform = platformFilter === "ALL" || item.platform === platformFilter;
      const matchesPriority = priorityFilter === "ALL" || item.priority === priorityFilter;

      return matchesQuery && matchesPlatform && matchesPriority;
    });
  }, [contentList, query, platformFilter, priorityFilter]);

  const handleMoveStage = async (item: ContentItem, direction: "prev" | "next") => {
    const currentIndex = CONTENT_STAGES.indexOf(item.status);
    if (direction === "prev" && currentIndex > 0) {
      const newStage = CONTENT_STAGES[currentIndex - 1];
      await DataService.updateContent(item.id, { status: newStage });
      toast.success(`Moved to ${newStage}`);
      await loadData();
    } else if (direction === "next" && currentIndex < CONTENT_STAGES.length - 1) {
      const newStage = CONTENT_STAGES[currentIndex + 1];
      await DataService.updateContent(item.id, { status: newStage });
      toast.success(`Advanced to ${newStage}`);
      await loadData();
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const success = await DataService.deleteContent(deletingItem.id);
      if (success) {
        toast.success(`Content "${deletingItem.title}" deleted.`);
        setContentList((prev) => prev.filter((c) => c.id !== deletingItem.id));
      } else {
        toast.error("Failed to delete content.");
      }
    } catch {
      toast.error("Failed to delete content.");
    } finally {
      setDeletingItem(null);
    }
  };

  const hasActiveFilters = query.trim() !== "" || platformFilter !== "ALL" || priorityFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setPlatformFilter("ALL");
    setPriorityFilter("ALL");
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Content Pipeline"
        subtitle="Manage the 8-stage production pipeline according to the content workflow specification."
        actions={
          <button
            type="button"
            onClick={() => {
              setStageForNewContent("Idea");
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
          >
            <span>+</span>
            <span>New Content</span>
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
                  placeholder="Search content by title, client, or assignee..."
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
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="ALL">All Platforms</option>
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
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

          {/* Kanban Pipeline Board */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Loading content pipeline...
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-[1500px]">
                {CONTENT_STAGES.map((stage, stageIndex) => {
                  const stageItems = filteredContent.filter((item) => item.status === stage);

                  return (
                    <div
                      key={stage}
                      className="w-[280px] shrink-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 flex flex-col shadow-sm"
                    >
                      {/* Column Header */}
                      <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                            {stageIndex + 1}
                          </span>
                          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate max-w-[160px]">
                            {stage}
                          </h2>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {stageItems.length}
                          </span>
                          <button
                            type="button"
                            title={`Add content in ${stage}`}
                            onClick={() => {
                              setStageForNewContent(stage);
                              setIsCreateOpen(true);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Cards List */}
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
                        {stageItems.length > 0 ? (
                          stageItems.map((item) => {
                            const isFirstStage = stageIndex === 0;
                            const isLastStage = stageIndex === CONTENT_STAGES.length - 1;

                            return (
                              <div
                                key={String(item.id)}
                                className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 hover:shadow transition"
                              >
                                <div className="flex items-start justify-between gap-1 mb-1.5">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate max-w-[120px]">
                                    {item.client}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <StatusBadge status={item.priority} />
                                  </div>
                                </div>

                                <h3
                                  onClick={() => setViewingItem(item)}
                                  className="text-xs font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition cursor-pointer"
                                >
                                  {item.title}
                                </h3>

                                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                    {item.platform}
                                  </span>
                                  <span>{item.dueDate}</span>
                                </div>

                                <div className="mt-2 text-[10px] text-slate-400">
                                  Assignee: <span className="text-slate-600 font-medium">{item.assignee}</span>
                                </div>

                                {/* Action Buttons & Stage Shift */}
                                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={isFirstStage}
                                      onClick={() => handleMoveStage(item, "prev")}
                                      title="Move to previous stage"
                                      className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                    >
                                      ←
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isLastStage}
                                      onClick={() => handleMoveStage(item, "next")}
                                      title="Advance to next stage"
                                      className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-slate-800 disabled:opacity-30"
                                    >
                                      →
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setViewingItem(item)}
                                      className="rounded p-1 text-[11px] text-slate-500 hover:text-slate-800"
                                      title="View Details"
                                    >
                                      👁
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingItem(item)}
                                      className="rounded p-1 text-[11px] text-slate-500 hover:text-slate-800"
                                      title="Edit"
                                    >
                                      ✎
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingItem(item)}
                                      className="rounded p-1 text-[11px] text-rose-500 hover:text-rose-700"
                                      title="Delete"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white/40 p-4 text-center text-xs text-slate-400">
                            No content in this stage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Content Modal */}
        <ContentModal
          isOpen={isCreateOpen || Boolean(editingItem)}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingItem(null);
          }}
          contentToEdit={editingItem}
          defaultStage={stageForNewContent}
          onSaved={() => loadData()}
        />

        {/* View Details Modal */}
        <ContentDetailsModal
          isOpen={Boolean(viewingItem)}
          onClose={() => setViewingItem(null)}
          content={viewingItem}
          onEdit={(c) => setEditingItem(c)}
          onDelete={(c) => setDeletingItem(c)}
          onStageChange={async () => {
            await loadData();
            if (viewingItem) {
              const fresh = await DataService.getContentById(viewingItem.id);
              setViewingItem(fresh || null);
            }
          }}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDelete}
          title="Delete Content Asset"
          message={`Are you sure you want to remove "${deletingItem?.title}" from the pipeline?`}
          confirmLabel="Delete Asset"
        />
      </AppShell>
    </ProtectedPage>
  );
}
