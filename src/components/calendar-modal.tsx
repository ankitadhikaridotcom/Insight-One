"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, CalendarEvent, Client } from "@/services/dataService";
import { SearchableSelect, SelectOption } from "./searchable-select";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  initialDate?: string;
  initialType?: "Meeting" | "Task" | "Content Deadline" | "Launch";
  onSaved?: (event: CalendarEvent) => void;
}

const EVENT_TYPE_OPTIONS: SelectOption[] = [
  { value: "Meeting", label: "Client / Team Meeting", subLabel: "Synchronous discussion or standup" },
  { value: "Content Deadline", label: "Content Deliverable Deadline", subLabel: "Asset submission target" },
  { value: "Launch", label: "Campaign / Product Launch", subLabel: "Go-live milestone" },
  { value: "Task", label: "Operational Sprint Task", subLabel: "Scheduled execution block" },
];

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

  const clientSelectOptions: SelectOption[] = useMemo(
    () =>
      clientOptions.map((c) => ({
        value: c.company || c.name,
        label: c.company || c.name,
        subLabel: c.industry,
      })),
    [clientOptions]
  );

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

      const created = await DataService.createCalendarEvent({
        title: title.trim(),
        client_id,
        client: client.trim(),
        date,
        startTime,
        endTime,
        type,
        description: description.trim(),
      });
      toast.success(`Event "${created.title}" scheduled in Supabase`);
      onSaved?.(created);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save calendar event to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? "Edit Calendar Event" : "Schedule New Event"}
      subtitle={
        eventToEdit
          ? "Update meeting details, deliverables, and calendar timing."
          : "Add a meeting, milestone, or deliverable deadline to the agency calendar."
      }
      maxWidth="3xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="calendar-modal-form"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? "Saving..." : eventToEdit ? "Save Changes" : "Schedule Event"}
          </button>
        </>
      }
    >
      <form id="calendar-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Event Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 Quarterly Business Review with Northstar Labs"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
          {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableSelect
            label="Associated Client"
            options={clientSelectOptions}
            value={client}
            onChange={(val) => setClient(val)}
            placeholder="Select client account..."
          />

          <SearchableSelect
            label="Event Type"
            options={EVENT_TYPE_OPTIONS}
            value={type}
            onChange={(val) => setType(val)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Event Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
            {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Meeting Agenda / Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda items, video conference link, or milestone scope..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>
      </form>
    </Modal>
  );
}
