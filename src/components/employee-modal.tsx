"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { DataService, Employee } from "@/services/dataService";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
  onSaved?: (employee: Employee) => void;
}

export function EmployeeModal({
  isOpen,
  onClose,
  employeeToEdit,
  onSaved,
}: EmployeeModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("Content");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"Active" | "Away" | "On Leave">("Active");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const DEPARTMENTS = [
    "Content",
    "Client Success",
    "Insights",
    "Engagement",
    "Engineering",
    "Executive",
    "Design",
    "Marketing",
  ];

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        setName(employeeToEdit.name);
        setEmail(employeeToEdit.email);
        setRole(employeeToEdit.role);
        setDepartment(employeeToEdit.department || "Content");
        setPhone(employeeToEdit.phone || "");
        setStatus(employeeToEdit.status || "Active");
        setPassword("");
      } else {
        setName("");
        setEmail("");
        setRole("");
        setDepartment("Content");
        setPhone("");
        setStatus("Active");
        setPassword("");
      }
      setShowPassword(false);
      setErrors({});
    }
  }, [isOpen, employeeToEdit]);

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let res = "Ins!";
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
    toast.success("Generated secure password!");
  };

  const copyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Full name is required";
    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email";
    }
    if (!role.trim()) newErrors.role = "Role / Title is required";

    if (!employeeToEdit && !password.trim()) {
      newErrors.password = "Password is required for user login";
    } else if (password && password.trim().length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (employeeToEdit) {
        const updates: any = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role.trim(),
          department,
          phone: phone.trim(),
          status,
        };
        if (password.trim()) {
          updates.password = password.trim();
        }

        const updated = await DataService.updateUser(employeeToEdit.id, updates);
        if (updated) {
          toast.success(
            password.trim()
              ? `User "${updated.name}" details and password updated successfully!`
              : `User "${updated.name}" updated successfully.`
          );
          onSaved?.(updated);
        }
      } else {
        const created = await DataService.createUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role.trim(),
          department,
          phone: phone.trim() || "+1 (555) 000-0000",
          status,
          password: password.trim(),
        });
        toast.success(`User "${created.name}" created with assigned password!`);
        onSaved?.(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save employee to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? "Edit Team Member" : "Add Team Member / User"}
      subtitle={
        employeeToEdit
          ? "Update user profile details, permissions, or reset login password."
          : "Register a new user and assign their login credentials."
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jordan Chen"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jchen@insightone.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Role / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Account Strategist"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            />
            {errors.role && <p className="mt-1 text-xs text-rose-500">{errors.role}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
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
            <option value="Active">Active</option>
            <option value="Away">Away</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        {/* Admin Password Assignment Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800">
              {employeeToEdit ? "Reset / Update Login Password" : "Assign Login Password"}{" "}
              {!employeeToEdit && <span className="text-rose-500">*</span>}
            </label>
            <button
              type="button"
              onClick={generateRandomPassword}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>⚡</span>
              <span>Generate Password</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                employeeToEdit
                  ? "Leave blank to keep existing password"
                  : "Enter user password (min 6 characters)"
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-20 text-sm text-slate-800 outline-none focus:border-slate-500"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {password && (
                <button
                  type="button"
                  onClick={copyPassword}
                  title="Copy password to clipboard"
                  className="rounded-lg p-1.5 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  📋
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                className="rounded-lg p-1.5 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {employeeToEdit
              ? "Leave blank to keep the member's current credentials, or type a new password to reset their access."
              : "The new user will use their email and this password to log in to Insight One."}
          </p>
          {errors.password && <p className="text-xs text-rose-500">{errors.password}</p>}
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
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? "Saving..." : employeeToEdit ? "Save Changes" : "Create User with Access"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
