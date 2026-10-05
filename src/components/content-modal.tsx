"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, ContentItem, ContentStage, CONTENT_STAGES, Client, Employee } from "@/services/dataService";

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentToEdit?: ContentItem | null;
  onSaved?: (item: ContentItem) => void;
  defaultStage?: ContentStage;
}

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

  const CONTENT_TYPES = [
    "Article / Blog Post",
    "Short Video / Reel",
    "Newsletter Issue",
    "Whitepaper / Guide",
    "Social Media Carousel",
    "Infographic",
    "Case Study",
    "Podcast / Audio",
  ];

  const PLATFORMS = [
    "LinkedIn",
    "Twitter / X",
    "Instagram",
    "YouTube",
    "Newsletter",
    "Blog",
    "TikTok",
  ];

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
        .catch(() => {
          // ignore or handle
        });
      setErrors({});
    }
  }, [isOpen, contentToEdit, defaultStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Content title is required";
    if (!client.trim()) newErrors.client = "Client is required";
    if (!assignee.trim()) newErrors.assignee = "Assigned employee is required";
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
        const updated = await DataService.updateContent(contentToEdit.id, {
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
          toast.success("Content item updated");
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createContent({
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
        toast.success(`Content "${created.title}" created in ${created.status}`);
        onSaved?.(created);
      }
      onClose();
    } catch {
      toast.error("Failed to save content item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contentToEdit ? "Edit Content Item" : "Create New Content"}
      subtitle={contentToEdit ? "Update content pipeline asset and delivery details." : "Add a new content asset to the production pipeline."}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Content Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 5 Strategies for AI Workflow Integration"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
          />
          {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
        </div>

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
              Assigned Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              {employeeOptions.map((emp) => (
                <option key={String(emp.id)} value={emp.name}>
                  {emp.name} ({emp.department})
                </option>
              ))}
              {employeeOptions.length === 0 && <option value="Maya Chen">Maya Chen</option>}
            </select>
            {errors.assignee && <p className="mt-1 text-xs text-rose-500">{errors.assignee}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Target Platform
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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Description / Brief
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline main talking points, creative direction, or copy ideas..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
            {errors.dueDate && <p className="mt-1 text-xs text-rose-500">{errors.dueDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Pipeline Stage
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStage)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              {CONTENT_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
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
            {loading ? "Saving..." : contentToEdit ? "Save Changes" : "Create Content"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
