"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, EngagementEntry, Client } from "@/services/dataService";
import { SearchableSelect, SelectOption } from "./searchable-select";

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: EngagementEntry | null;
  onSaved?: (entry: EngagementEntry) => void;
}

const PLATFORM_OPTIONS: SelectOption[] = [
  { value: "LinkedIn", label: "LinkedIn", subLabel: "B2B professional metrics" },
  { value: "Instagram", label: "Instagram", subLabel: "Reels & carousels" },
  { value: "Twitter / X", label: "Twitter / X", subLabel: "Impressions & reposts" },
  { value: "YouTube", label: "YouTube", subLabel: "Watch time & views" },
  { value: "Newsletter", label: "Newsletter", subLabel: "Open rates & clicks" },
  { value: "TikTok", label: "TikTok", subLabel: "Video plays & shares" },
  { value: "Blog", label: "Corporate Blog", subLabel: "Pageviews & time on page" },
];

const PERFORMANCE_OPTIONS: SelectOption[] = [
  { value: "Above benchmark", label: "Above Benchmark", subLabel: "Top 10% outlier viral post" },
  { value: "Strong", label: "Strong", subLabel: "Exceeds campaign KPI target" },
  { value: "Growing", label: "Growing", subLabel: "Positive upward momentum" },
  { value: "Average", label: "Average", subLabel: "Consistent with standard baseline" },
];

export function EngagementModal({
  isOpen,
  onClose,
  entryToEdit,
  onSaved,
}: EngagementModalProps) {
  const { toast } = useToast();
  const [client, setClient] = useState("");
  const [platform, setPlatform] = useState("LinkedIn");
  const [date, setDate] = useState("");
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [shares, setShares] = useState(0);
  const [reach, setReach] = useState(0);
  const [impressions, setImpressions] = useState(0);
  const [performance, setPerformance] = useState<"Above benchmark" | "Strong" | "Growing" | "Average">("Strong");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [clientOptions, setClientOptions] = useState<Client[]>([]);

  useEffect(() => {
    if (isOpen) {
      DataService.getClients()
        .then((clients) => {
          setClientOptions(clients);

          if (entryToEdit) {
            setClient(entryToEdit.client);
            setPlatform(entryToEdit.platform);
            setDate(entryToEdit.date || "");
            setLikes(entryToEdit.likes || 0);
            setComments(entryToEdit.comments || 0);
            setShares(entryToEdit.shares || 0);
            setReach(entryToEdit.reach || 0);
            setImpressions(entryToEdit.impressions || 0);
            setPerformance(entryToEdit.performance || "Strong");
            setNotes(entryToEdit.notes || "");
          } else {
            setClient(clients[0]?.company || clients[0]?.name || "Northstar Labs");
            setPlatform("LinkedIn");
            setDate(new Date().toISOString().split("T")[0]);
            setLikes(150);
            setComments(24);
            setShares(18);
            setReach(5200);
            setImpressions(8400);
            setPerformance("Strong");
            setNotes("");
          }
        })
        .catch(() => {});
      setErrors({});
    }
  }, [isOpen, entryToEdit]);

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

    if (!client.trim()) newErrors.client = "Client is required";
    if (!platform.trim()) newErrors.platform = "Platform is required";
    if (!date.trim()) newErrors.date = "Reporting date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const matchingClient = clientOptions.find((c) => c.company === client.trim() || c.name === client.trim());
      const client_id = matchingClient?.id || entryToEdit?.client_id;

      const created = await DataService.createEngagementMetric({
        client_id,
        client: client.trim(),
        platform,
        date,
        likes: Number(likes) || 0,
        comments: Number(comments) || 0,
        shares: Number(shares) || 0,
        reach: Number(reach) || 0,
        impressions: Number(impressions) || 0,
        performance,
        notes: notes.trim(),
      });
      toast.success(`Engagement logged for ${created.platform} in Supabase`);
      onSaved?.(created);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save engagement metric to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryToEdit ? "Edit Performance Metrics" : "Log Performance & Analytics"}
      subtitle={
        entryToEdit
          ? "Update campaign reach, audience interactions, and impressions."
          : "Record content performance metrics across social channels."
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
            form="engagement-modal-form"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? "Saving..." : entryToEdit ? "Save Changes" : "Save Metrics"}
          </button>
        </>
      }
    >
      <form id="engagement-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableSelect
            label="Client Account"
            required
            options={clientSelectOptions}
            value={client}
            onChange={(val) => setClient(val)}
            placeholder="Select client..."
            error={errors.client}
          />

          <SearchableSelect
            label="Platform"
            required
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(val) => setPlatform(val)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Reporting Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
            {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
          </div>

          <SearchableSelect
            label="Performance Grade"
            options={PERFORMANCE_OPTIONS}
            value={performance}
            onChange={(val) => setPerformance(val)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Likes / Reacts
            </label>
            <input
              type="number"
              min="0"
              value={likes}
              onChange={(e) => setLikes(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Comments
            </label>
            <input
              type="number"
              min="0"
              value={comments}
              onChange={(e) => setComments(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Shares / Reposts
            </label>
            <input
              type="number"
              min="0"
              value={shares}
              onChange={(e) => setShares(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Unique Reach
            </label>
            <input
              type="number"
              min="0"
              value={reach}
              onChange={(e) => setReach(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Total Impressions
            </label>
            <input
              type="number"
              min="0"
              value={impressions}
              onChange={(e) => setImpressions(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Key Insights & Takeaways
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Audience feedback, high performing creative elements, or conversion notes..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>
      </form>
    </Modal>
  );
}
