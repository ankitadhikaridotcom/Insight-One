"use client";

import React from "react";
import { Modal } from "./modal";
import { CalendarEvent } from "@/services/dataService";
import { StatusBadge } from "./status-badge";

interface CalendarEventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export function CalendarEventDetailsModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
}: CalendarEventDetailsModalProps) {
  if (!event) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      subtitle={event.client ? `Client: ${event.client}` : "Internal Event"}
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <StatusBadge status={event.type} />
          <span className="text-xs font-semibold text-slate-700">
            {event.date} • {event.startTime || "All Day"} {event.endTime ? `- ${event.endTime}` : ""}
          </span>
        </div>

        {event.description && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Description & Details
            </span>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(event);
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
          >
            Delete Event
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
                onEdit(event);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              Edit Event
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
