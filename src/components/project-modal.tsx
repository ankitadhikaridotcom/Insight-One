"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, Project, Client, Employee } from "@/services/dataService";
import { SearchableSelect, SelectOption } from "./searchable-select";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
  onSaved?: (project: Project) => void;
}

export function ProjectModal({
  isOpen,
  onClose,
  projectToEdit,
  onSaved,
}: ProjectModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [manager, setManager] = useState("");
  const [assignedTeam, setAssignedTeam] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [status, setStatus] = useState<"Planning" | "In Progress" | "Review" | "Completed" | "On Hold">("Planning");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [clientOptions, setClientOptions] = useState<Client[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([DataService.getClients(), DataService.getUsers()]).then(([cls, emps]) => {
        setClientOptions(cls);
        setEmployeeOptions(emps);

        if (projectToEdit) {
          setName(projectToEdit.name);
          setClient(projectToEdit.client);
          setDescription(projectToEdit.description || "");
          setManager(projectToEdit.manager || "");
          setAssignedTeam(projectToEdit.assignedTeam || "");
          setStartDate(projectToEdit.startDate || "");
          setDueDate(projectToEdit.dueDate || "");
          setPriority(projectToEdit.priority || "Medium");
          setStatus(projectToEdit.status || "Planning");
        } else {
          setName("");
          setClient(cls[0]?.company || cls[0]?.name || "Northstar Labs");
          setDescription("");
          setManager(emps[0]?.name || "Maya Chen");
          setAssignedTeam("");
          setStartDate(new Date().toISOString().split("T")[0]);
          setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
          setPriority("Medium");
          setStatus("Planning");
        }
      });
      setErrors({});
    }
  }, [isOpen, projectToEdit]);

  const clientSelectOptions: SelectOption[] = useMemo(
    () =>
      clientOptions.map((c) => ({
        value: c.company || c.name,
        label: c.company || c.name,
        subLabel: c.industry || c.status,
      })),
    [clientOptions]
  );

  const managerSelectOptions: SelectOption[] = useMemo(
    () =>
      employeeOptions.map((e) => ({
        value: e.name,
        label: e.name,
        subLabel: `${e.role} • ${e.department}`,
      })),
    [employeeOptions]
  );

  const prioritySelectOptions: SelectOption[] = [
    { value: "Low", label: "Low Priority", subLabel: "Routine milestone" },
    { value: "Medium", label: "Medium Priority", subLabel: "Standard deliverable" },
    { value: "High", label: "High Priority", subLabel: "Critical client deadline" },
  ];

  const statusSelectOptions: SelectOption[] = [
    { value: "Planning", label: "Planning", subLabel: "Scoping and backlog" },
    { value: "In Progress", label: "In Progress", subLabel: "Active execution" },
    { value: "Review", label: "Review & QA", subLabel: "Internal and client review" },
    { value: "Completed", label: "Completed", subLabel: "Deliverable signed off" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Project name is required";
    if (!client.trim()) newErrors.client = "Client is required";
    if (!manager.trim()) newErrors.manager = "Project manager is required";
    if (!dueDate.trim()) newErrors.dueDate = "Due date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    const matchedClient = clientOptions.find((c) => (c.company || c.name) === client);

    try {
      if (projectToEdit) {
        const updated = await DataService.updateProject(projectToEdit.id, {
          name: name.trim(),
          client: client.trim(),
          client_id: matchedClient?.id || projectToEdit.client_id,
          description: description.trim(),
          manager: manager.trim(),
          assignedTeam: assignedTeam.trim() || manager.trim(),
          startDate,
          dueDate,
          priority,
          status,
        });
        if (updated) {
          toast.success("Project updated in Supabase");
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createProject({
          name: name.trim(),
          client: client.trim(),
          client_id: matchedClient?.id,
          description: description.trim(),
          manager: manager.trim(),
          assignedTeam: assignedTeam.trim() || manager.trim(),
          startDate,
          dueDate,
          priority,
          status,
          progress: status === "Completed" ? 100 : status === "Review" ? 85 : status === "In Progress" ? 45 : 10,
        });
        toast.success(`Project "${created.name}" created in Supabase`);
        onSaved?.(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save project to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? "Edit Project" : "Create New Project"}
      subtitle={
        projectToEdit
          ? "Update project roadmap, deliverables, and team ownership."
          : "Add a client project to track deliverables and milestones across the Kanban pipeline."
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
            form="project-modal-form"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? "Saving..." : projectToEdit ? "Save Changes" : "Create Project"}
          </button>
        </>
      }
    >
      <form id="project-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 Multi-Channel Growth Engine"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableSelect
            label="Client Account"
            required
            options={clientSelectOptions}
            value={client}
            onChange={(val) => setClient(val)}
            placeholder="Select client company..."
            error={errors.client}
          />

          <SearchableSelect
            label="Project Lead / Manager"
            required
            options={managerSelectOptions}
            value={manager}
            onChange={(val) => setManager(val)}
            placeholder="Select project lead..."
            error={errors.manager}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Assigned Team Members
          </label>
          <input
            type="text"
            value={assignedTeam}
            onChange={(e) => setAssignedTeam(e.target.value)}
            placeholder="e.g. Maya Chen, Alex Rivera, Priya Shah"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Description & Scope
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Target objectives, deliverable parameters, and milestone roadmap..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
            />
            {errors.dueDate && <p className="mt-1 text-xs text-rose-500">{errors.dueDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableSelect
            label="Priority Level"
            options={prioritySelectOptions}
            value={priority}
            onChange={(val) => setPriority(val)}
          />

          <SearchableSelect
            label="Kanban Status"
            options={statusSelectOptions}
            value={status}
            onChange={(val) => setStatus(val)}
          />
        </div>
      </form>
    </Modal>
  );
}
