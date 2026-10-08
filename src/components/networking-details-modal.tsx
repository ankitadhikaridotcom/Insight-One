"use client";

import React from "react";
import { Modal } from "./modal";
import { NetworkingEntry } from "@/services/dataService";
import { StatusBadge } from "./status-badge";

interface NetworkingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: NetworkingEntry | null;
  onEdit: (entry: NetworkingEntry) => void;
  onDelete: (entry: NetworkingEntry) => void;
}

export function NetworkingDetailsModal({
  isOpen,
  onClose,
  entry,
  onEdit,
  onDelete,
}: NetworkingDetailsModalProps) {
  if (!entry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry.person}
      subtitle={`${entry.company} • ${entry.type}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={entry.status} />
            <span className="text-xs font-medium text-slate-500">Date: {entry.date}</span>
          </div>
          {entry.followUpDate && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium border border-amber-200">
              Follow-up: {entry.followUpDate}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Email</span>
            <span className="font-semibold text-slate-800 truncate block">{entry.email || "No email"}</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Phone</span>
            <span className="font-semibold text-slate-800">{entry.phone || "No phone"}</span>
          </div>
        </div>

        {entry.notes && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Discussion Notes
            </span>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(entry);
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
          >
            Delete Entry
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
                onEdit(entry);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              Edit Log
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
