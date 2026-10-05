"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, Task, Client, Employee } from "@/services/dataService";

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
            setStatus(taskToEdit.status || "To Do");
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
          toast.success("Task updated successfully");
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
        toast.success(`Task "${created.title}" created successfully`);
        onSaved?.(created);
      }
      onClose();
    } catch {
      toast.error("Failed to save task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Task" : "Create New Task"}
      subtitle={taskToEdit ? "Update deliverable details, assignee, or status." : "Add a task deliverable and assign team ownership."}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Prepare quarterly review slide deck"
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
                  {emp.name} ({emp.role})
                </option>
              ))}
              {employeeOptions.length === 0 && <option value="Alex Rivera">Alex Rivera</option>}
            </select>
            {errors.assignee && <p className="mt-1 text-xs text-rose-500">{errors.assignee}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details, acceptance criteria, or relevant links..."
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
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
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
            {loading ? "Saving..." : taskToEdit ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
