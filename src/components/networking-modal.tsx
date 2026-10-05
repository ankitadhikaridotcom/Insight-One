"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, NetworkingEntry } from "@/services/dataService";
import { SearchableSelect, SelectOption } from "./searchable-select";

interface NetworkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: NetworkingEntry | null;
  onSaved?: (entry: NetworkingEntry) => void;
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: "Call", label: "Phone / Intro Call", subLabel: "Direct 1-on-1 audio chat" },
  { value: "Coffee", label: "Coffee / In-Person", subLabel: "Local casual meeting" },
  { value: "Conference", label: "Industry Conference", subLabel: "Event networking & summit" },
  { value: "Partnership", label: "Partnership Strategy", subLabel: "Co-marketing or agency alliance" },
  { value: "Meeting", label: "Formal Presentation", subLabel: "Executive pitch or demo" },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "Connected", label: "Connected", subLabel: "Initial dialogue established" },
  { value: "Planned", label: "Planned", subLabel: "Scheduled on upcoming calendar" },
  { value: "Follow-up", label: "Follow-up", subLabel: "Action items or proposal pending" },
];

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
        const updated = await DataService.updateNetworkingContact(entryToEdit.id, {
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
          toast.success("Networking entry updated in Supabase");
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createNetworkingContact({
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
        toast.success(`Connected with "${created.person}" in Supabase`);
        onSaved?.(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save networking entry to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryToEdit ? "Edit Networking Contact" : "Log Networking Interaction"}
      subtitle={
        entryToEdit
          ? "Update stakeholder contact information and follow-up timeline."
          : "Record an executive connection, agency partner, or client referral."
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
            form="networking-modal-form"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? "Saving..." : entryToEdit ? "Save Changes" : "Log Connection"}
          </button>
        </>
      }
    >
      <form id="networking-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Contact / Person Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="e.g. Rhett Cole"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
            {errors.person && <p className="mt-1 text-xs text-rose-500">{errors.person}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Organization / Company <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Summit Media"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
            {errors.company && <p className="mt-1 text-xs text-rose-500">{errors.company}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rhett@summitmedia.co"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 749-1123"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableSelect
            label="Interaction Type"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(val) => setType(val)}
          />

          <SearchableSelect
            label="Connection Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(val) => setStatus(val)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Interaction Date <span className="text-rose-500">*</span>
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
              Next Follow-Up Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Discussion Summary & Partnership Opportunities
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key talking points, collaboration synergies, next steps..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>
      </form>
    </Modal>
  );
}
