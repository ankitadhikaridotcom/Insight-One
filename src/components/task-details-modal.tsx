"use client";

import React from "react";
import { Modal } from "./modal";
import { Task, DataService } from "@/services/dataService";
import { StatusBadge } from "./status-badge";
import { useToast } from "./toast";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange?: () => void;
}

export function TaskDetailsModal({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskDetailsModalProps) {
  const { toast } = useToast();
  if (!task) return null;

  const handleUpdateStatus = async (newStatus: "To Do" | "In Progress" | "Blocked" | "Completed") => {
    const updated = await DataService.updateTask(task.id, { status: newStatus });
    if (updated) {
      toast.success(`Task status changed to ${newStatus}`);
      onStatusChange?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      subtitle={`Client: ${task.client}`}
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            <StatusBadge status={task.priority} />
          </div>
          <span className="text-xs text-slate-500">
            Due: <strong className="text-slate-800">{task.dueDate}</strong>
          </span>
        </div>

        {task.description && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Description
            </span>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Assigned To</span>
            <span className="font-semibold text-slate-800">{task.assignee}</span>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Client</span>
            <span className="font-semibold text-slate-800">{task.client}</span>
          </div>
        </div>

        {/* Quick Status Bar */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Update Task Status
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {(["To Do", "In Progress", "Blocked", "Completed"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleUpdateStatus(st)}
                className={`rounded-lg py-1.5 text-xs font-medium transition ${
                  task.status === st
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(task);
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
          >
            Delete Task
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
                onEdit(task);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              Edit Task
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
