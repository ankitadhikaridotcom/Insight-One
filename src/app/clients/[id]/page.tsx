"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, Client, Project, Task, ContentItem } from "@/services/dataService";
import { StatusBadge } from "@/components/status-badge";
import { ClientModal } from "@/components/client-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { useToast } from "@/components/toast";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const loadData = async () => {
    try {
      const found = await DataService.getClientById(id);
      if (found) {
        setClient(found);
        const clientName = (found.company || found.name || "").toLowerCase();
        const [allProjects, allTasks, allContent] = await Promise.all([
          DataService.getProjects(),
          DataService.getTasks(),
          DataService.getContent(),
        ]);
        setProjects(allProjects.filter((p) => (p.client || "").toLowerCase() === clientName || p.client_id === found.id));
        setTasks(allTasks.filter((t) => (t.client || "").toLowerCase() === clientName || t.client_id === found.id));
        setContent(allContent.filter((c) => (c.client || "").toLowerCase() === clientName || c.client_id === found.id));
      }
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
  }, [id]);

  const handleDelete = async () => {
    if (!client) return;
    try {
      const success = await DataService.deleteClient(client.id);
      if (success) {
        toast.success(`Client "${client.company || client.name}" removed.`);
        router.push("/clients");
      } else {
        toast.error("Failed to delete client.");
      }
    } catch {
      toast.error("Failed to delete client.");
    }
  };

  if (loading) {
    return (
      <ProtectedPage>
        <AppShell title="Client Details">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading client profile...
          </div>
        </AppShell>
      </ProtectedPage>
    );
  }

  if (!client) {
    return (
      <ProtectedPage>
        <AppShell title="Client Not Found">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <h3 className="text-base font-semibold text-slate-800">Client Not Found</h3>
            <p className="mt-1 text-sm text-slate-500">The client record does not exist or was removed.</p>
            <Link
              href="/clients"
              className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
            >
              ← Back to Clients
            </Link>
          </div>
        </AppShell>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <AppShell
        title={client.company || client.name}
        subtitle={`Account Details • Primary Contact: ${client.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/clients"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              ← All Clients
            </Link>
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              Edit Client
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-100 transition"
            >
              Delete
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-bold text-slate-900">{client.company}</h2>
                  <StatusBadge status={client.status} />
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {client.industry} • Account Value: <span className="font-semibold text-slate-800">{client.value}</span>
                </div>
              </div>

              {client.website && (
                <a
                  href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  <span>Visit Website</span>
                  <span>↗</span>
                </a>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
              <div>
                <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block mb-1">
                  Primary Contact
                </span>
                <span className="text-sm font-semibold text-slate-800">{client.name}</span>
              </div>
              <div>
                <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block mb-1">
                  Email
                </span>
                <a href={`mailto:${client.email}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">
                  {client.email}
                </a>
              </div>
              <div>
                <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block mb-1">
                  Phone
                </span>
                <span className="text-sm font-medium text-slate-800">{client.phone || "Not specified"}</span>
              </div>
            </div>

            {client.notes && (
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block mb-1">
                  Account Notes
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Associated Projects and Tasks */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Projects */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">Projects ({projects.length})</h3>
                <Link href="/projects" className="text-xs font-medium text-blue-600 hover:underline">
                  View all
                </Link>
              </div>

              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div key={String(p.id)} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900">{p.name}</span>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Lead: {p.manager}</span>
                        <span>Due: {p.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  No projects linked to this client yet.
                </div>
              )}
            </div>

            {/* Content Items */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">Content Pipeline ({content.length})</h3>
                <Link href="/content" className="text-xs font-medium text-blue-600 hover:underline">
                  View pipeline
                </Link>
              </div>

              {content.length > 0 ? (
                <div className="space-y-3">
                  {content.map((c) => (
                    <div key={String(c.id)} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900">{c.title}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{c.platform}</span>
                        <span>Assignee: {c.assignee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  No content pipeline items for this client yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <ClientModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          clientToEdit={client}
          onSaved={() => loadData()}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Client"
          message={`Are you sure you want to remove "${client.company || client.name}"? This action cannot be undone.`}
          confirmLabel="Delete Client"
        />
      </AppShell>
    </ProtectedPage>
  );
}
