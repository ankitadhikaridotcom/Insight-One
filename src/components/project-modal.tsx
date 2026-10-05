"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, Project, Client, Employee } from "@/services/dataService";

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
  const [status, setStatus] = useState<"Planning" | "In Progress" | "On Hold" | "Completed">("Planning");
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
      subtitle={projectToEdit ? "Update project details and timeline." : "Add a client project to track deliverables and milestones."}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 Brand Overhaul"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
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
              Project Manager <span className="text-rose-500">*</span>
            </label>
            <select
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              {employeeOptions.map((emp) => (
                <option key={String(emp.id)} value={emp.name}>
                  {emp.name} ({emp.role})
                </option>
              ))}
              {employeeOptions.length === 0 && <option value="Maya Chen">Maya Chen</option>}
            </select>
            {errors.manager && <p className="mt-1 text-xs text-rose-500">{errors.manager}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Assigned Team Members
          </label>
          <input
            type="text"
            value={assignedTeam}
            onChange={(e) => setAssignedTeam(e.target.value)}
            placeholder="e.g. Maya Chen, Alex Rivera, Priya Shah"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope, target objectives, and expected deliverables..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
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
            {loading ? "Saving..." : projectToEdit ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
