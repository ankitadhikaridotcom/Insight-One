"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { Employee, Task, DataService } from "@/services/dataService";
import { StatusBadge } from "./status-badge";

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export function EmployeeDetailsModal({
  isOpen,
  onClose,
  employee,
  onEdit,
  onDelete,
}: EmployeeDetailsModalProps) {
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (isOpen && employee) {
      DataService.getTasks()
        .then((allTasks) => {
          setAssignedTasks(
            allTasks.filter((t) => t.assignee.toLowerCase() === employee.name.toLowerCase())
          );
        })
        .catch(() => {});
    }
  }, [isOpen, employee]);

  if (!employee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee.name} subtitle={employee.role} maxWidth="md">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Department:</span>
            <span className="text-xs font-semibold text-slate-800">{employee.department}</span>
          </div>
          <StatusBadge status={employee.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Email</span>
            <a href={`mailto:${employee.email}`} className="font-medium text-slate-800 hover:text-blue-600 transition truncate block">
              {employee.email}
            </a>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Phone</span>
            <span className="font-medium text-slate-800">{employee.phone || "Not specified"}</span>
          </div>
        </div>

        {/* Account Access & Credentials */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Login Access</span>
            <span className="text-xs text-slate-700">Account login enabled with assigned password</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(employee);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm flex items-center gap-1"
          >
            <span>🔑</span>
            <span>Reset Password</span>
          </button>
        </div>

        <div>
          <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
            Assigned Tasks ({assignedTasks.length})
          </h4>
          {assignedTasks.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {assignedTasks.map((task) => (
                <div key={String(task.id)} className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-xs">
                  <span className="font-medium text-slate-800 truncate pr-2">{task.title}</span>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No tasks currently assigned.</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(employee);
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
          >
            Delete User
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
