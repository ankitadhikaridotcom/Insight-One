"use client";

import React from "react";
import { Modal } from "./modal";
import { ContentItem, ContentStage, CONTENT_STAGES, DataService } from "@/services/dataService";
import { StatusBadge } from "./status-badge";
import { useToast } from "./toast";

interface ContentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem | null;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onStageChange?: () => void;
}

export function ContentDetailsModal({
  isOpen,
  onClose,
  content,
  onEdit,
  onDelete,
  onStageChange,
}: ContentDetailsModalProps) {
  const { toast } = useToast();
  if (!content) return null;

  const currentStageIndex = CONTENT_STAGES.indexOf(content.status);

  const handleMoveStage = async (newStage: ContentStage) => {
    const updated = await DataService.updateContent(content.id, { status: newStage });
    if (updated) {
      toast.success(`Moved to "${newStage}" stage.`);
      onStageChange?.();
    }
  };

  const handleNextStage = async () => {
    if (currentStageIndex < CONTENT_STAGES.length - 1) {
      await handleMoveStage(CONTENT_STAGES[currentStageIndex + 1]);
    }
  };

  const handlePrevStage = async () => {
    if (currentStageIndex > 0) {
      await handleMoveStage(CONTENT_STAGES[currentStageIndex - 1]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={content.title}
      subtitle={`Client: ${content.client} • Platform: ${content.platform}`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={content.status} />
            <StatusBadge status={content.priority} />
            <span className="text-xs text-slate-500 font-medium">Type: {content.contentType}</span>
          </div>
          <span className="text-xs text-slate-500">
            Due Date: <strong className="text-slate-800">{content.dueDate}</strong>
          </span>
        </div>

        {/* BRD Pipeline Stage Progression Tracker */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-500">
              Pipeline Stage ({currentStageIndex + 1} of {CONTENT_STAGES.length})
            </span>
            <span className="text-xs font-bold text-slate-900">{content.status}</span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 mb-3">
            {CONTENT_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={stage}
                  title={stage}
                  className={`h-2 rounded-full transition ${
                    isCurrent
                      ? "bg-slate-900 ring-2 ring-slate-400 ring-offset-1"
                      : isPast
                      ? "bg-emerald-500"
                      : "bg-slate-200"
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <button
              type="button"
              disabled={currentStageIndex <= 0}
              onClick={handlePrevStage}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
            >
              ← Previous Stage
            </button>
            <select
              value={content.status}
              onChange={(e) => handleMoveStage(e.target.value as ContentStage)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800"
            >
              {CONTENT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={currentStageIndex >= CONTENT_STAGES.length - 1}
              onClick={handleNextStage}
              className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 transition disabled:opacity-40"
            >
              Next Stage →
            </button>
          </div>
        </div>

        {content.description && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Creative Brief & Notes
            </span>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{content.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Assigned Lead</span>
            <span className="font-semibold text-slate-800">{content.assignee}</span>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Target Platform</span>
            <span className="font-semibold text-slate-800">{content.platform}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(content);
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
          >
            Delete Content
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
                onEdit(content);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              Edit Content
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
