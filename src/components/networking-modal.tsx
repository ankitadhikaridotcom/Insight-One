"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, NetworkingEntry } from "@/services/dataService";

interface NetworkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: NetworkingEntry | null;
  onSaved?: (entry: NetworkingEntry) => void;
}

export function NetworkingModal({
  isOpen,
  onClose,
  entryToEdit,
  onSaved,
}: NetworkingModalProps) {
  const { toast } = useToast();
  const [person, setPerson] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"Coffee" | "Call" | "Conference" | "Partnership" | "Meeting">("Call");
  const [status, setStatus] = useState<"Planned" | "Connected" | "Follow-up">("Connected");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (entryToEdit) {
        setPerson(entryToEdit.person);
        setCompany(entryToEdit.company);
        setEmail(entryToEdit.email || "");
        setPhone(entryToEdit.phone || "");
        setDate(entryToEdit.date || "");
        setType(entryToEdit.type || "Call");
        setStatus(entryToEdit.status || "Connected");
        setNotes(entryToEdit.notes || "");
        setFollowUpDate(entryToEdit.followUpDate || "");
      } else {
        setPerson("");
        setCompany("");
        setEmail("");
        setPhone("");
        setDate(new Date().toISOString().split("T")[0]);
        setType("Call");
        setStatus("Connected");
        setNotes("");
        setFollowUpDate(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
      }
      setErrors({});
    }
  }, [isOpen, entryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!person.trim()) newErrors.person = "Contact / Person name is required";
    if (!company.trim()) newErrors.company = "Company is required";
    if (!date.trim()) newErrors.date = "Interaction date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (entryToEdit) {
        const updated = await DataService.updateNetworking(entryToEdit.id, {
          person: person.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim(),
          date,
          type,
          status,
          notes: notes.trim(),
          followUpDate,
        });
        if (updated) {
          toast.success("Networking entry updated");
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createNetworking({
          person: person.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim(),
          date,
          type,
          status,
          notes: notes.trim(),
          followUpDate,
        });
        toast.success(`Network entry for "${created.person}" logged successfully`);
        onSaved?.(created);
      }
      onClose();
    } catch {
      toast.error("Failed to save networking record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryToEdit ? "Edit Networking Log" : "Add Networking Entry"}
      subtitle={entryToEdit ? "Update contact relationship details and notes." : "Record a strategic interaction, call, or partner conversation."}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Person Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
            {errors.person && <p className="mt-1 text-xs text-rose-500">{errors.person}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Company <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Media Group"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
            {errors.company && <p className="mt-1 text-xs text-rose-500">{errors.company}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@acme.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 234-5678"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Interaction Date <span className="text-rose-500">*</span>
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
              Networking Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              <option value="Coffee">Coffee</option>
              <option value="Call">Call</option>
              <option value="Conference">Conference</option>
              <option value="Partnership">Partnership</option>
              <option value="Meeting">Meeting</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              <option value="Planned">Planned</option>
              <option value="Connected">Connected</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Notes / Discussion Points
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key discussion takeaways, mutual synergies, next steps..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Follow-up Date
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
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
            {loading ? "Saving..." : entryToEdit ? "Save Changes" : "Save Entry"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
