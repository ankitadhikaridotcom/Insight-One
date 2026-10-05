"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { Client, Project, Task, ContentItem, DataService } from "@/services/dataService";
import { StatusBadge } from "./status-badge";

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientDetailsModal({
  isOpen,
  onClose,
  client,
  onEdit,
  onDelete,
}: ClientDetailsModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    if (isOpen && client) {
      const clientName = (client.company || client.name || "").toLowerCase();
      Promise.all([
        DataService.getProjects(),
        DataService.getTasks(),
        DataService.getContent(),
      ])
        .then(([p, t, c]) => {
          setProjects(p.filter((x) => (x.client || "").toLowerCase() === clientName || x.client_id === client.id));
          setTasks(t.filter((x) => (x.client || "").toLowerCase() === clientName || x.client_id === client.id));
          setContent(c.filter((x) => (x.client || "").toLowerCase() === clientName || x.client_id === client.id));
        })
        .catch(() => {});
    }
  }, [isOpen, client]);

  if (!client) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client.company || client.name}
      subtitle={`Account Contact: ${client.name} • ${client.industry || "General"}`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={client.status} />
            <span className="text-xs font-semibold text-slate-700">Value: {client.value || "$25k"}</span>
          </div>
          {client.website && (
            <a
              href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Visit Website</span>
              <span>↗</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Primary Email</span>
            <a href={`mailto:${client.email}`} className="font-medium text-slate-800 hover:text-blue-600 truncate block">
              {client.email}
            </a>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Phone Number</span>
            <span className="font-medium text-slate-800">{client.phone || "Not specified"}</span>
          </div>
        </div>

        {client.notes && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Account Notes</span>
            <p className="text-xs text-slate-700 leading-relaxed">{client.notes}</p>
          </div>
        )}

        {/* Associated Assets Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-400 uppercase font-semibold">Projects</div>
            <div className="mt-1 text-lg font-bold text-slate-800">{projects.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-400 uppercase font-semibold">Content Items</div>
            <div className="mt-1 text-lg font-bold text-slate-800">{content.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-400 uppercase font-semibold">Open Tasks</div>
            <div className="mt-1 text-lg font-bold text-slate-800">{tasks.length}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(client);
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
          >
            Delete Client
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(client);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              Edit Client
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
