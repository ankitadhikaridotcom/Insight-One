"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, CalendarEvent, Client } from "@/services/dataService";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  initialDate?: string;
  initialType?: "Meeting" | "Task" | "Content Deadline" | "Launch";
  onSaved?: (event: CalendarEvent) => void;
}

export function CalendarModal({
  isOpen,
  onClose,
  eventToEdit,
  initialDate,
  initialType = "Meeting",
  onSaved,
}: CalendarModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [type, setType] = useState<"Meeting" | "Task" | "Content Deadline" | "Launch">(initialType);
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [clientOptions, setClientOptions] = useState<Client[]>([]);

  useEffect(() => {
    if (isOpen) {
      DataService.getClients()
        .then((clients) => {
          setClientOptions(clients);

          if (eventToEdit) {
            setTitle(eventToEdit.title);
            setDate(eventToEdit.date);
            setStartTime(eventToEdit.startTime || "10:00");
            setEndTime(eventToEdit.endTime || "11:00");
            setType(eventToEdit.type || "Meeting");
            setClient(eventToEdit.client || "");
            setDescription(eventToEdit.description || "");
          } else {
            setTitle("");
            setDate(initialDate || new Date().toISOString().split("T")[0]);
            setStartTime("10:00");
            setEndTime("11:00");
            setType(initialType);
            setClient(clients[0]?.company || clients[0]?.name || "Northstar Labs");
            setDescription("");
          }
        })
        .catch(() => {});
      setErrors({});
    }
  }, [isOpen, eventToEdit, initialDate, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Event title is required";
    if (!date.trim()) newErrors.date = "Event date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const matchingClient = clientOptions.find((c) => c.company === client.trim() || c.name === client.trim());
      const client_id = matchingClient?.id || eventToEdit?.client_id;

      if (eventToEdit) {
        const updated = await DataService.updateEvent(eventToEdit.id, {
          title: title.trim(),
          date,
          startTime,
          endTime,
          type,
          client: client.trim(),
          client_id,
          description: description.trim(),
        });
        if (updated) {
          toast.success("Calendar event updated");
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createEvent({
          title: title.trim(),
          date,
          startTime,
          endTime,
          type,
          client: client.trim(),
          client_id,
          description: description.trim(),
        });
        toast.success(`Event "${created.title}" scheduled`);
        onSaved?.(created);
      }
      onClose();
    } catch {
      toast.error("Failed to save calendar event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? "Edit Calendar Event" : "Schedule New Event"}
      subtitle={eventToEdit ? "Update event details and schedule." : "Schedule a client meeting, launch, task, or content deadline."}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Event Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 Roadmap Review or Content Asset Draft Due"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
          />
          {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Event Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              <option value="Meeting">Meeting</option>
              <option value="Content Deadline">Content Deadline</option>
              <option value="Task">Task</option>
              <option value="Launch">Launch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Client
            </label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              {clientOptions.map((c) => (
                <option key={String(c.id)} value={c.company || c.name}>
                  {c.company || c.name}
                </option>
              ))}
              {clientOptions.length === 0 && <option value="Northstar Labs">Northstar Labs</option>}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
            {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Description / Agenda
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda items, video call link, or deadline checklist..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Saving..." : eventToEdit ? "Save Changes" : "Schedule Event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
