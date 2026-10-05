"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, EngagementEntry } from "@/services/dataService";
import { EngagementModal } from "@/components/engagement-modal";
import { EngagementDetailsModal } from "@/components/engagement-details-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";

export default function EngagementPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<EngagementEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EngagementEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<EngagementEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<EngagementEntry | null>(null);

  const loadData = async () => {
    try {
      const data = await DataService.getEngagement();
      setEntries(data);
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
    return Array.from(new Set(entries.map((e) => e.platform).filter(Boolean)));
  }, [entries]);

  const summary = useMemo(() => {
    const totalLikes = entries.reduce((acc, curr) => acc + (curr.likes || 0), 0);
    const totalComments = entries.reduce((acc, curr) => acc + (curr.comments || 0), 0);
    const totalReach = entries.reduce((acc, curr) => acc + (curr.reach || 0), 0);
    const totalShares = entries.reduce((acc, curr) => acc + (curr.shares || 0), 0);
    return { totalLikes, totalComments, totalReach, totalShares };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesQuery =
        !query.trim() ||
        `${entry.client} ${entry.platform} ${entry.metrics} ${entry.notes || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesPlatform = platformFilter === "ALL" || entry.platform === platformFilter;

      return matchesQuery && matchesPlatform;
    });
  }, [entries, query, platformFilter]);

  const handleDelete = async () => {
    if (!deletingEntry) return;
    try {
      const success = await DataService.deleteEngagement(deletingEntry.id);
      if (success) {
        toast.success(`Removed engagement metrics for "${deletingEntry.client}".`);
        setEntries((prev) => prev.filter((e) => e.id !== deletingEntry.id));
      } else {
        toast.error("Failed to delete engagement entry.");
      }
    } catch {
      toast.error("Failed to delete engagement entry.");
    } finally {
      setDeletingEntry(null);
    }
  };

  const hasActiveFilters = query.trim() !== "" || platformFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setPlatformFilter("ALL");
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Engagement"
        subtitle="Monitor audience interaction, platform-level traction, and qualitative insights."
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
          >
            <span>+</span>
            <span>Add Engagement</span>
          </button>
        }
      >
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Total Reach</span>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {(summary.totalReach / 1000).toFixed(1)}k
              </div>
              <div className="mt-1 text-xs text-emerald-600 font-medium">+14.2% vs last month</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Total Likes</span>
              <div className="mt-2 text-2xl font-bold text-slate-900">{summary.totalLikes.toLocaleString()}</div>
              <div className="mt-1 text-xs text-slate-500 font-medium">Across active platforms</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Comments</span>
              <div className="mt-2 text-2xl font-bold text-slate-900">{summary.totalComments.toLocaleString()}</div>
              <div className="mt-1 text-xs text-emerald-600 font-medium">High intent sentiment</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Shares & Reposts</span>
              <div className="mt-2 text-2xl font-bold text-slate-900">{summary.totalShares.toLocaleString()}</div>
              <div className="mt-1 text-xs text-slate-500 font-medium">Viral amplification</div>
            </div>
          </div>

          {/* Controls: Search and Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search engagement by client, platform, or metrics..."
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

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">Loading engagement records...</div>
            ) : filteredEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Client</th>
                      <th className="py-3.5 px-4 font-semibold">Platform</th>
                      <th className="py-3.5 px-4 font-semibold">Date</th>
                      <th className="py-3.5 px-4 font-semibold">Metrics Snapshot</th>
                      <th className="py-3.5 px-4 font-semibold">Performance</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.map((entry) => (
                      <tr
                        key={String(entry.id)}
                        className="hover:bg-slate-50/70 transition cursor-pointer"
                        onClick={() => setViewingEntry(entry)}
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{entry.client}</td>
                        <td className="py-3.5 px-4">
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                            {entry.platform}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600">{entry.date}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {entry.metrics || `${entry.likes || 0} likes • ${entry.reach || 0} reach`}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={entry.performance || "Strong"} />
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingEntry(entry)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingEntry(entry)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingEntry(entry)}
                              className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title={hasActiveFilters ? "No matching engagement logs" : "No engagement records found"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your search query or platform filter."
                    : "Track content performance metrics by logging your first engagement entry."
                }
                actionLabel={hasActiveFilters ? "Clear Filters" : "+ Add engagement"}
                onAction={hasActiveFilters ? clearFilters : () => setIsAddOpen(true)}
                icon="◔"
              />
            )}
          </div>
        </div>

        {/* Add / Edit Engagement Modal */}
        <EngagementModal
          isOpen={isAddOpen || Boolean(editingEntry)}
          onClose={() => {
            setIsAddOpen(false);
            setEditingEntry(null);
          }}
          entryToEdit={editingEntry}
          onSaved={() => loadData()}
        />

        {/* View Details Modal */}
        <EngagementDetailsModal
          isOpen={Boolean(viewingEntry)}
          onClose={() => setViewingEntry(null)}
          entry={viewingEntry}
          onEdit={(e) => setEditingEntry(e)}
          onDelete={(e) => setDeletingEntry(e)}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deletingEntry)}
          onClose={() => setDeletingEntry(null)}
          onConfirm={handleDelete}
          title="Delete Engagement Record"
          message={`Are you sure you want to delete engagement records for "${deletingEntry?.client}"?`}
          confirmLabel="Delete Record"
        />
      </AppShell>
    </ProtectedPage>
  );
}
