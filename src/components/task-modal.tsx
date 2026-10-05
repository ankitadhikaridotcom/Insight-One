"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, Task, Client, Employee } from "@/services/dataService";
import { SearchableSelect, SelectOption } from "./searchable-select";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  onSaved?: (task: Task) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  taskToEdit,
  onSaved,
}: TaskModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [client, setClient] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [status, setStatus] = useState<"To Do" | "In Progress" | "Blocked" | "Completed">("To Do");
  const [dueDate, setDueDate] = useState("");
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

          if (taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description || "");
            setClient(taskToEdit.client);
            setAssignee(taskToEdit.assignee);
            setPriority(taskToEdit.priority || "Medium");
            setStatus(taskToEdit.status as any || "To Do");
            setDueDate(taskToEdit.dueDate || "");
          } else {
            setTitle("");
            setDescription("");
            setClient(clients[0]?.company || clients[0]?.name || "Northstar Labs");
            setAssignee(employees[0]?.name || "Alex Rivera");
            setPriority("Medium");
            setStatus("To Do");
            setDueDate(new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]);
          }
        })
        .catch(() => {});
      setErrors({});
    }
  }, [isOpen, taskToEdit]);

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

  const priorityOptions: SelectOption[] = [
    { value: "Low", label: "Low Priority", subLabel: "Flexible delivery" },
    { value: "Medium", label: "Medium Priority", subLabel: "Standard priority" },
    { value: "High", label: "High Priority", subLabel: "Urgent turnaround" },
  ];

  const statusOptions: SelectOption[] = [
    { value: "To Do", label: "To Do", subLabel: "Pending kickoff" },
    { value: "In Progress", label: "In Progress", subLabel: "Currently being worked on" },
    { value: "Review", label: "Review", subLabel: "Quality review" },
    { value: "Completed", label: "Completed", subLabel: "Finished & verified" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Task title is required";
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
      const client_id = matchingClient?.id || taskToEdit?.client_id;

      if (taskToEdit) {
        const updated = await DataService.updateTask(taskToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          client: client.trim(),
          client_id,
          assignee: assignee.trim(),
          priority,
          status,
          dueDate,
        });
        if (updated) {
          toast.success("Task updated successfully in Supabase");
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createTask({
          title: title.trim(),
          description: description.trim(),
          client: client.trim(),
          client_id,
          assignee: assignee.trim(),
          priority,
          status,
          dueDate,
        });
        toast.success(`Task "${created.title}" created in Supabase`);
        onSaved?.(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save task to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Task" : "Create New Task"}
      subtitle={taskToEdit ? "Update deliverable scope and assignee." : "Assign a concrete action item or deliverable."}
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
            form="task-modal-form"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? "Saving..." : taskToEdit ? "Save Changes" : "Create Task"}
          </button>
        </>
      }
    >
      <form id="task-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Audit Q3 LinkedIn analytics & benchmarks"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
          {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableSelect
            label="Associated Client"
            required
            options={clientSelectOptions}
            value={client}
            onChange={(val) => setClient(val)}
            placeholder="Select client..."
            error={errors.client}
          />

          <SearchableSelect
            label="Assigned Team Member"
            required
            options={assigneeSelectOptions}
            value={assignee}
            onChange={(val) => setAssignee(val)}
            placeholder="Select assignee..."
            error={errors.assignee}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Description & Instructions
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Context, deliverable requirements, or links to assets..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          <SearchableSelect
            label="Priority"
            options={priorityOptions}
            value={priority}
            onChange={(val) => setPriority(val)}
          />

          <SearchableSelect
            label="Status"
            options={statusOptions}
            value={status}
            onChange={(val) => setStatus(val)}
          />
        </div>
      </form>
    </Modal>
  );
}
