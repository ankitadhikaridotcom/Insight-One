"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, NetworkingEntry } from "@/services/dataService";
import { NetworkingModal } from "@/components/networking-modal";
import { NetworkingDetailsModal } from "@/components/networking-details-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";
import { SearchableSelect, SelectOption } from "@/components/searchable-select";

export default function NetworkingPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<NetworkingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NetworkingEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<NetworkingEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<NetworkingEntry | null>(null);

  const loadData = async () => {
    try {
      const data = await DataService.getNetworking();
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

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesQuery =
        !query.trim() ||
        `${entry.person} ${entry.company} ${entry.email} ${entry.notes || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesType = typeFilter === "ALL" || entry.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || entry.status === statusFilter;

      return matchesQuery && matchesType && matchesStatus;
    });
  }, [entries, query, typeFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deletingEntry) return;
    try {
      const success = await DataService.deleteNetworking(deletingEntry.id);
      if (success) {
        toast.success(`Removed networking log for "${deletingEntry.person}".`);
        setEntries((prev) => prev.filter((e) => e.id !== deletingEntry.id));
      } else {
        toast.error("Failed to delete networking entry.");
      }
    } catch {
      toast.error("Failed to delete networking entry.");
    } finally {
      setDeletingEntry(null);
    }
  };

  const hasActiveFilters = query.trim() !== "" || typeFilter !== "ALL" || statusFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Networking"
        subtitle="Capture strategic relationship moments, partnership opportunities, and follow-up reminders."
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
          >
            <span>+</span>
            <span>Add Networking</span>
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
                  placeholder="Search networking by person, company, or discussion..."
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
                  placeholder="All Types"
                  options={[
                    { value: "ALL", label: "All Types" },
                    { value: "Coffee", label: "Coffee" },
                    { value: "Call", label: "Call" },
                    { value: "Conference", label: "Conference" },
                    { value: "Partnership", label: "Partnership" },
                    { value: "Meeting", label: "Meeting" },
                  ] as SelectOption[]}
                  value={typeFilter}
                  onChange={(val: string) => setTypeFilter(val ?? "ALL")}
                  isClearable={false}
                  className="w-40"
                />

                <SearchableSelect
                  placeholder="All Statuses"
                  options={[
                    { value: "ALL", label: "All Statuses" },
                    { value: "Planned", label: "Planned" },
                    { value: "Connected", label: "Connected" },
                    { value: "Follow-up", label: "Follow-up" },
                  ] as SelectOption[]}
                  value={statusFilter}
                  onChange={(val: string) => setStatusFilter(val ?? "ALL")}
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

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">Loading networking logs...</div>
            ) : filteredEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Person</th>
                      <th className="py-3.5 px-4 font-semibold">Company</th>
                      <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                      <th className="py-3.5 px-4 font-semibold">Type</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Date</th>
                      <th className="py-3.5 px-4 font-semibold">Follow-up</th>
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
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div className="font-semibold text-slate-900">{entry.person}</div>
                          {entry.notes && (
                            <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">{entry.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{entry.company}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div>{entry.email || "-"}</div>
                          {entry.phone && <div className="text-slate-400">{entry.phone}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={entry.status} />
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600">{entry.date}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-amber-700">
                          {entry.followUpDate || "-"}
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
                title={hasActiveFilters ? "No matching networking logs" : "No networking entries found"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your search query or type filter."
                    : "Log a connection, coffee chat, or conference lead to track partner momentum."
                }
                actionLabel={hasActiveFilters ? "Clear Filters" : "+ New network log"}
                onAction={hasActiveFilters ? clearFilters : () => setIsAddOpen(true)}
                icon="◌"
              />
            )}
          </div>
        </div>

        {/* Add / Edit Networking Modal */}
        <NetworkingModal
          isOpen={isAddOpen || Boolean(editingEntry)}
          onClose={() => {
            setIsAddOpen(false);
            setEditingEntry(null);
          }}
          entryToEdit={editingEntry}
          onSaved={() => loadData()}
        />

        {/* View Details Modal */}
        <NetworkingDetailsModal
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
          title="Delete Networking Log"
          message={`Are you sure you want to delete the networking record for "${deletingEntry?.person}"?`}
          confirmLabel="Delete Log"
        />
      </AppShell>
    </ProtectedPage>
  );
}
