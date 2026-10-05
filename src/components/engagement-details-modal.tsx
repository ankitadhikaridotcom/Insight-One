"use client";

import React from "react";
import { Modal } from "./modal";
import { EngagementEntry } from "@/services/dataService";
import { StatusBadge } from "./status-badge";

interface EngagementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: EngagementEntry | null;
  onEdit: (entry: EngagementEntry) => void;
  onDelete: (entry: EngagementEntry) => void;
}

export function EngagementDetailsModal({
  isOpen,
  onClose,
  entry,
  onEdit,
  onDelete,
}: EngagementDetailsModalProps) {
  if (!entry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry.client}
      subtitle={`${entry.platform} • ${entry.date}`}
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
            {entry.platform}
          </span>
          <StatusBadge status={entry.performance || "Strong"} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Likes</span>
            <div className="mt-1 text-lg font-bold text-slate-900">{entry.likes || 0}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Comments</span>
            <div className="mt-1 text-lg font-bold text-slate-900">{entry.comments || 0}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Shares</span>
            <div className="mt-1 text-lg font-bold text-slate-900">{entry.shares || 0}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Reach</span>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {entry.reach ? `${(entry.reach / 1000).toFixed(1)}k` : "0"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Impressions</span>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {entry.impressions ? `${(entry.impressions / 1000).toFixed(1)}k` : "0"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Performance</span>
            <div className="mt-1 text-xs font-bold text-emerald-700 truncate">{entry.performance}</div>
          </div>
        </div>

        {entry.notes && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Campaign Insights & Qualitative Notes
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
            Delete Record
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
              Edit Metrics
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
