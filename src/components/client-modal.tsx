"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, Client } from "@/services/dataService";
import { SearchableSelect, SelectOption } from "./searchable-select";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
  onSaved?: (client: Client) => void;
}

const INDUSTRY_OPTIONS: SelectOption[] = [
  { value: "SaaS & Technology", label: "SaaS & Technology", subLabel: "Software & AI platforms" },
  { value: "Fintech", label: "Fintech", subLabel: "Financial technologies & payments" },
  { value: "Design & Creative", label: "Design & Creative", subLabel: "Agencies & creative studios" },
  { value: "E-commerce", label: "E-commerce", subLabel: "Direct-to-consumer & retail" },
  { value: "Healthcare", label: "Healthcare", subLabel: "Healthtech & biotech" },
  { value: "Logistics & Supply Chain", label: "Logistics & Supply Chain", subLabel: "Transport & distribution" },
  { value: "Media & Publishing", label: "Media & Publishing", subLabel: "Digital content & news" },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "Active", label: "Active", subLabel: "Current active retainer" },
  { value: "Prospect", label: "Prospect", subLabel: "Discovery & evaluation" },
  { value: "At Risk", label: "At Risk", subLabel: "Requires executive check-in" },
];

export function ClientModal({
  isOpen,
  onClose,
  clientToEdit,
  onSaved,
}: ClientModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("SaaS & Technology");
  const [status, setStatus] = useState<"Active" | "Prospect" | "At Risk">("Active");
  const [value, setValue] = useState("$25k");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setName(clientToEdit.name);
        setCompany(clientToEdit.company);
        setEmail(clientToEdit.email);
        setPhone(clientToEdit.phone || "");
        setWebsite(clientToEdit.website || "");
        setIndustry(clientToEdit.industry || "SaaS & Technology");
        setStatus(clientToEdit.status || "Active");
        setValue(clientToEdit.value || "$25k");
        setNotes(clientToEdit.notes || "");
      } else {
        setName("");
        setCompany("");
        setEmail("");
        setPhone("");
        setWebsite("");
        setIndustry("SaaS & Technology");
        setStatus("Active");
        setValue("$30k");
        setNotes("");
      }
      setErrors({});
    }
  }, [isOpen, clientToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Contact / Client name is required";
    if (!company.trim()) newErrors.company = "Company name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Valid email is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (clientToEdit) {
        const updated = await DataService.updateClient(clientToEdit.id, {
          name: name.trim(),
          company: company.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          website: website.trim(),
          industry,
          status,
          value,
          notes: notes.trim(),
        });
        if (updated) {
          toast.success("Client account updated in Supabase");
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createClient({
          name: name.trim(),
          company: company.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          website: website.trim(),
          industry,
          status,
          value,
          notes: notes.trim(),
        });
        toast.success(`Client "${created.company}" created in Supabase`);
        onSaved?.(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save client to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? "Edit Client Account" : "Add Client Account"}
      subtitle={
        clientToEdit
          ? "Update client contract value, contact information, and account status."
          : "Register a new client company into your multi-tenant agency portfolio."
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
            form="client-modal-form"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? "Saving..." : clientToEdit ? "Save Changes" : "Create Client Account"}
          </button>
        </>
      }
    >
      <form id="client-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Northstar Labs"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
            {errors.company && <p className="mt-1 text-xs text-rose-500">{errors.company}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Primary Contact <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emma Lawson"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Contact Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emma@northstarlabs.co"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 723-9012"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Website URL
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://northstarlabs.co"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Estimated Retainer Value
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. $42k / month"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableSelect
            label="Industry Sector"
            options={INDUSTRY_OPTIONS}
            value={industry}
            onChange={(val) => setIndustry(val)}
          />

          <SearchableSelect
            label="Account Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(val) => setStatus(val)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Internal Notes & Strategic Context
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Account background, deliverable preferences, or key stakeholder priorities..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>
      </form>
    </Modal>
  );
}
