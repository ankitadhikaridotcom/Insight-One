"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, EngagementEntry, Client } from "@/services/dataService";

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: EngagementEntry | null;
  onSaved?: (entry: EngagementEntry) => void;
}

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

  const PLATFORMS = [
    "LinkedIn",
    "Instagram",
    "Twitter / X",
    "YouTube",
    "Newsletter",
    "TikTok",
    "Blog",
  ];

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

    const metricsStr = `${reach > 0 ? `${(reach / 1000).toFixed(1)}k reach` : `${likes} likes`} • ${comments} comments`;

    try {
      const matchingClient = clientOptions.find((c) => c.company === client.trim() || c.name === client.trim());
      const client_id = matchingClient?.id || entryToEdit?.client_id;

      if (entryToEdit) {
        const updated = await DataService.updateEngagement(entryToEdit.id, {
          client: client.trim(),
          client_id,
          platform: platform.trim(),
          date,
          likes: Number(likes),
          comments: Number(comments),
          shares: Number(shares),
          reach: Number(reach),
          impressions: Number(impressions),
          metrics: metricsStr,
          performance,
          notes: notes.trim(),
        });
        if (updated) {
          toast.success("Engagement record updated");
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createEngagement({
          client: client.trim(),
          client_id,
          platform: platform.trim(),
          date,
          likes: Number(likes),
          comments: Number(comments),
          shares: Number(shares),
          reach: Number(reach),
          impressions: Number(impressions),
          metrics: metricsStr,
          performance,
          notes: notes.trim(),
        });
        toast.success(`Engagement logged for ${created.client} (${created.platform})`);
        onSaved?.(created);
      }
      onClose();
    } catch {
      toast.error("Failed to save engagement record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryToEdit ? "Edit Engagement Record" : "Add Engagement Metrics"}
      subtitle={entryToEdit ? "Update audience interaction metrics." : "Track performance, reach, and interaction statistics for client campaigns."}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Client <span className="text-rose-500">*</span>
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
            {errors.client && <p className="mt-1 text-xs text-rose-500">{errors.client}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Platform <span className="text-rose-500">*</span>
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Date / Period <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="e.g. YYYY-MM-DD or current date range"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
            {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Benchmark Performance
            </label>
            <select
              value={performance}
              onChange={(e) => setPerformance(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              <option value="Above benchmark">Above benchmark</option>
              <option value="Strong">Strong</option>
              <option value="Growing">Growing</option>
              <option value="Average">Average</option>
            </select>
          </div>
        </div>

        {/* Numeric Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Likes</label>
            <input
              type="number"
              min={0}
              value={likes}
              onChange={(e) => setLikes(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Comments</label>
            <input
              type="number"
              min={0}
              value={comments}
              onChange={(e) => setComments(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Shares</label>
            <input
              type="number"
              min={0}
              value={shares}
              onChange={(e) => setShares(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reach</label>
            <input
              type="number"
              min={0}
              value={reach}
              onChange={(e) => setReach(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Impressions</label>
            <input
              type="number"
              min={0}
              value={impressions}
              onChange={(e) => setImpressions(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Notes / Insights
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Qualitative takeaways, audience sentiment, top performing assets..."
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
            {loading ? "Saving..." : entryToEdit ? "Save Changes" : "Add Engagement"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
