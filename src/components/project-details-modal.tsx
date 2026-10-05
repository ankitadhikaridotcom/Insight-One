"use client";

import React from "react";
import { Modal } from "./modal";
import { Project } from "@/services/dataService";
import { StatusBadge } from "./status-badge";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onEdit,
  onDelete,
}: ProjectDetailsModalProps) {
  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project.name} subtitle={`Client: ${project.client}`} maxWidth="xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <StatusBadge status={project.priority} />
          <span className="text-xs text-slate-500">
            Due: <strong className="text-slate-700">{project.dueDate}</strong>
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-1">Scope & Objectives</h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            {project.description || "No project description provided."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Project Manager</span>
            <span className="font-semibold text-slate-800">{project.manager || "Unassigned"}</span>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Assigned Team</span>
            <span className="font-semibold text-slate-800">{project.assignedTeam || project.manager || "General Team"}</span>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Start Date</span>
            <span className="font-semibold text-slate-800">{project.startDate || "-"}</span>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Target Due Date</span>
            <span className="font-semibold text-slate-800">{project.dueDate || "-"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(project);
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
          >
            Delete Project
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
                onEdit(project);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              Edit Project
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
