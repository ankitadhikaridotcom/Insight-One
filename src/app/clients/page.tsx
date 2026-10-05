"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, Client } from "@/services/dataService";
import { ClientModal } from "@/components/client-modal";
import { ClientDetailsModal } from "@/components/client-details-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [industryFilter, setIndustryFilter] = useState("ALL");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const loadData = async () => {
    try {
      const data = await DataService.getClients();
      setClients(data);
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

  const industries = useMemo(() => {
    return Array.from(new Set(clients.map((c) => c.industry).filter(Boolean)));
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesQuery =
        !query.trim() ||
        `${client.name} ${client.company} ${client.email} ${client.industry} ${client.notes || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || client.status === statusFilter;
      const matchesIndustry = industryFilter === "ALL" || client.industry === industryFilter;

      return matchesQuery && matchesStatus && matchesIndustry;
    });
  }, [clients, query, statusFilter, industryFilter]);

  const handleDelete = async () => {
    if (!deletingClient) return;
    try {
      const success = await DataService.deleteClient(deletingClient.id);
      if (success) {
        toast.success(`Client "${deletingClient.company || deletingClient.name}" removed successfully.`);
        setClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
      } else {
        toast.error("Failed to delete client record.");
      }
    } catch {
      toast.error("Failed to delete client record.");
    } finally {
      setDeletingClient(null);
    }
  };

  const hasActiveFilters = query.trim() !== "" || statusFilter !== "ALL" || industryFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setIndustryFilter("ALL");
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Clients"
        subtitle="Manage client partnerships, contractual accounts, and delivery health."
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
          >
            <span>+</span>
            <span>Add Client</span>
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
                  placeholder="Search clients by company, contact, or industry..."
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
                  <option value="Active">Active</option>
                  <option value="Prospect">Prospect</option>
                  <option value="At Risk">At Risk</option>
                </select>

                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="ALL">All Industries</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
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

          {/* Clients Cards Grid */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Loading clients...
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {filteredClients.map((client) => (
                <div
                  key={String(client.id)}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => setViewingClient(client)}
                            className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition cursor-pointer"
                          >
                            {client.company}
                          </h3>
                          <StatusBadge status={client.status} />
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {client.industry} • Contact: <span className="text-slate-700 font-medium">{client.name}</span>
                        </div>
                      </div>

                      <span className="rounded-xl bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-100">
                        {client.value || "$25k"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                        <span className="font-medium text-slate-800 truncate block">{client.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                        <span className="font-medium text-slate-800">{client.phone || "Not specified"}</span>
                      </div>
                    </div>

                    {client.notes && (
                      <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {client.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingClient(client)}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Quick View
                      </button>
                      <span className="text-slate-300">•</span>
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Full Details →
                      </Link>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingClient(client)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingClient(client)}
                        className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={hasActiveFilters ? "No matching clients" : "No clients found"}
              description={
                hasActiveFilters
                  ? "Try resetting your search query or adjusting your filters."
                  : "Start managing client relationships and deliverables by adding your first client."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : "+ Add client"}
              onAction={hasActiveFilters ? clearFilters : () => setIsAddOpen(true)}
              icon="◎"
            />
          )}
        </div>

        {/* Add / Edit Client Modal */}
        <ClientModal
          isOpen={isAddOpen || Boolean(editingClient)}
          onClose={() => {
            setIsAddOpen(false);
            setEditingClient(null);
          }}
          clientToEdit={editingClient}
          onSaved={() => loadData()}
        />

        {/* View Client Details Modal */}
        <ClientDetailsModal
          isOpen={Boolean(viewingClient)}
          onClose={() => setViewingClient(null)}
          client={viewingClient}
          onEdit={(c) => setEditingClient(c)}
          onDelete={(c) => setDeletingClient(c)}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deletingClient)}
          onClose={() => setDeletingClient(null)}
          onConfirm={handleDelete}
          title="Delete Client"
          message={`Are you sure you want to remove "${deletingClient?.company || deletingClient?.name}"? All associated pipeline references will remain.`}
          confirmLabel="Delete Client"
        />
      </AppShell>
    </ProtectedPage>
  );
}
