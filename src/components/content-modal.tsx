"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, ContentItem, ContentStage, CONTENT_STAGES, Client, Employee } from "@/services/dataService";
import { SearchableSelect, SelectOption } from "./searchable-select";

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentToEdit?: ContentItem | null;
  onSaved?: (item: ContentItem) => void;
  defaultStage?: ContentStage;
}

const CONTENT_TYPES: SelectOption[] = [
  { value: "Article / Blog Post", label: "Article / Blog Post", subLabel: "Long-form editorial" },
  { value: "Short Video / Reel", label: "Short Video / Reel", subLabel: "TikTok, Reels & Shorts" },
  { value: "Newsletter Issue", label: "Newsletter Issue", subLabel: "Direct email subscriber broadcast" },
  { value: "Whitepaper / Guide", label: "Whitepaper / Guide", subLabel: "In-depth industry report" },
  { value: "Social Media Carousel", label: "Social Media Carousel", subLabel: "Multi-slide visual deck" },
  { value: "Infographic", label: "Infographic", subLabel: "Data visualization graphic" },
  { value: "Case Study", label: "Case Study", subLabel: "Client proof of work" },
  { value: "Podcast / Audio", label: "Podcast / Audio", subLabel: "Audio interview or episode" },
];

const PLATFORMS: SelectOption[] = [
  { value: "LinkedIn", label: "LinkedIn", subLabel: "B2B professional audience" },
  { value: "Twitter / X", label: "Twitter / X", subLabel: "Real-time updates & threads" },
  { value: "Instagram", label: "Instagram", subLabel: "Visual lifestyle & reels" },
  { value: "YouTube", label: "YouTube", subLabel: "Long-form video library" },
  { value: "Newsletter", label: "Newsletter", subLabel: "Substack / Beehiiv" },
  { value: "Blog", label: "Corporate Blog", subLabel: "Organic search & SEO" },
  { value: "TikTok", label: "TikTok", subLabel: "Viral short-form content" },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: "Low", label: "Low Priority", subLabel: "Flexible publish date" },
  { value: "Medium", label: "Medium Priority", subLabel: "Standard pipeline item" },
  { value: "High", label: "High Priority", subLabel: "Urgent campaign launch" },
];

const STAGE_OPTIONS: SelectOption[] = CONTENT_STAGES.map((st) => ({
  value: st,
  label: st,
  subLabel: `Pipeline stage: ${st}`,
}));

export function ContentModal({
  isOpen,
  onClose,
  contentToEdit,
  onSaved,
  defaultStage = "Idea",
}: ContentModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [contentType, setContentType] = useState("Article / Blog Post");
  const [platform, setPlatform] = useState("LinkedIn");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ContentStage>(defaultStage);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [clientOptions, setClientOptions] = useState<Client[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([DataService.getClients(), DataService.getUsers()])
        .then(([clients, employees]) => {
          setClientOptions(clients);
          setEmployeeOptions(employees);

          if (contentToEdit) {
            setTitle(contentToEdit.title);
            setClient(contentToEdit.client);
            setContentType(contentToEdit.contentType || "Article / Blog Post");
            setPlatform(contentToEdit.platform || "LinkedIn");
            setDescription(contentToEdit.description || "");
            setAssignee(contentToEdit.assignee);
            setPriority(contentToEdit.priority || "Medium");
            setDueDate(contentToEdit.dueDate || "");
            setStatus(contentToEdit.status || "Idea");
          } else {
            setTitle("");
            setClient(clients[0]?.company || clients[0]?.name || "Northstar Labs");
            setContentType("Article / Blog Post");
            setPlatform("LinkedIn");
            setDescription("");
            setAssignee(employees[0]?.name || "Maya Chen");
            setPriority("Medium");
            setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
            setStatus(defaultStage);
          }
        })
        .catch(() => {});
      setErrors({});
    }
  }, [isOpen, contentToEdit, defaultStage]);

  const clientSelectOptions: SelectOption[] = useMemo(
    () =>
      clientOptions.map((c) => ({
        value: c.company || c.name,
        label: c.company || c.name,
        subLabel: c.industry,
      })),
    [clientOptions]
  );

  const assigneeSelectOptions: SelectOption[] = useMemo(
    () =>
      employeeOptions.map((e) => ({
        value: e.name,
        label: e.name,
        subLabel: `${e.role} • ${e.department}`,
      })),
    [employeeOptions]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Content title is required";
    if (!client.trim()) newErrors.client = "Client is required";
    if (!assignee.trim()) newErrors.assignee = "Assignee is required";
    if (!dueDate.trim()) newErrors.dueDate = "Due date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const matchingClient = clientOptions.find((c) => c.company === client.trim() || c.name === client.trim());
      const client_id = matchingClient?.id || contentToEdit?.client_id;

      if (contentToEdit) {
        const updated = await DataService.updateContentItem(contentToEdit.id, {
          title: title.trim(),
          client: client.trim(),
          client_id,
          contentType,
          platform,
          description: description.trim(),
          assignee: assignee.trim(),
          priority,
          dueDate,
          status,
        });
        if (updated) {
          toast.success("Content asset updated in Supabase");
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createContentItem({
          title: title.trim(),
          client: client.trim(),
          client_id,
          contentType,
          platform,
          description: description.trim(),
          assignee: assignee.trim(),
          priority,
          dueDate,
          status,
        });
        toast.success(`Content "${created.title}" added to pipeline in Supabase`);
        onSaved?.(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save content to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contentToEdit ? "Edit Content Asset" : "Create New Content Asset"}
      subtitle={
        contentToEdit
          ? "Update publication metadata, creative brief, and assigned creators."
          : "Add an asset to the 8-stage content production pipeline."
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
            form="content-modal-form"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? "Saving..." : contentToEdit ? "Save Changes" : "Publish to Pipeline"}
          </button>
        </>
      }
    >
      <form id="content-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Asset Headline / Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 5 Enterprise AI Playbooks Transforming Retention"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
          {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
        </div>

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
            label="Assigned Creator / Strategist"
            required
            options={assigneeSelectOptions}
            value={assignee}
            onChange={(val) => setAssignee(val)}
            placeholder="Select creator..."
            error={errors.assignee}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableSelect
            label="Content Format"
            options={CONTENT_TYPES}
            value={contentType}
            onChange={(val) => setContentType(val)}
          />

          <SearchableSelect
            label="Distribution Platform"
            options={PLATFORMS}
            value={platform}
            onChange={(val) => setPlatform(val)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Creative Brief & Deliverable Notes
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key talking points, angle, call to action, or link to research docs..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
            {errors.dueDate && <p className="mt-1 text-xs text-rose-500">{errors.dueDate}</p>}
          </div>

          <SearchableSelect
            label="Priority Level"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={(val) => setPriority(val)}
          />

          <SearchableSelect
            label="Pipeline Stage"
            options={STAGE_OPTIONS}
            value={status}
            onChange={(val) => setStatus(val)}
          />
        </div>
      </form>
    </Modal>
  );
}
