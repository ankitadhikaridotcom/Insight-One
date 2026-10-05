"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, Employee } from "@/services/dataService";
import { EmployeeModal } from "@/components/employee-modal";
import { EmployeeDetailsModal } from "@/components/employee-details-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";

export default function TeamPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filter state
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const loadData = async () => {
    try {
      const data = await DataService.getUsers();
      setEmployees(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener("insightone_storage_changed", handleStorageChange);
    window.addEventListener("insightone_supabase_changed", handleStorageChange);
    return () => {
      window.removeEventListener("insightone_storage_changed", handleStorageChange);
      window.removeEventListener("insightone_supabase_changed", handleStorageChange);
    };
  }, []);

  const departments = useMemo(() => {
    const list = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
    return list;
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesQuery =
        !query.trim() ||
        `${employee.name} ${employee.email} ${employee.role} ${employee.department} ${employee.phone || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesDept = departmentFilter === "ALL" || employee.department === departmentFilter;
      const matchesStatus = statusFilter === "ALL" || employee.status === statusFilter;

      return matchesQuery && matchesDept && matchesStatus;
    });
  }, [employees, query, departmentFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    try {
      const success = await DataService.deleteUser(deletingEmployee.id);
      if (success) {
        toast.success(`Removed "${deletingEmployee.name}" from the team.`);
        setEmployees((prev) => prev.filter((e) => e.id !== deletingEmployee.id));
      } else {
        toast.error("Failed to delete user record.");
      }
    } catch {
      toast.error("Failed to delete user record.");
    } finally {
      setDeletingEmployee(null);
    }
  };

  const hasActiveFilters = query.trim() !== "" || departmentFilter !== "ALL" || statusFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setDepartmentFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Team"
        subtitle="People, roles, and administrative access across the Insight One organization."
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
          >
            <span>+</span>
            <span>Add employee</span>
          </button>
        }
      >
        <div className="space-y-6">
          {/* Controls: Search and Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search employees by name, email, or role..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Away">Away</option>
                  <option value="On Leave">On Leave</option>
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Employees Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">Loading team members...</div>
            ) : filteredEmployees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Name</th>
                      <th className="py-3.5 px-4 font-semibold">Email & Phone</th>
                      <th className="py-3.5 px-4 font-semibold">Role</th>
                      <th className="py-3.5 px-4 font-semibold">Department</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((employee) => (
                      <tr
                        key={String(employee.id)}
                        className="hover:bg-slate-50/70 transition cursor-pointer"
                        onClick={() => setViewingEmployee(employee)}
                      >
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-700 text-xs">
                              {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{employee.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{employee.email}</div>
                          {employee.phone && (
                            <div className="text-xs text-slate-400">{employee.phone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{employee.role}</td>
                        <td className="py-3.5 px-4 text-slate-600">{employee.department}</td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={employee.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingEmployee(employee)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingEmployee(employee)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingEmployee(employee)}
                              title="Reset or assign password for this user"
                              className="rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition flex items-center gap-1"
                            >
                              <span>🔑</span>
                              <span>Password</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingEmployee(employee)}
                              className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title={hasActiveFilters ? "No matching employees" : "No employees found"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your search query or department filters."
                    : "Add your first team member to start assigning content and tasks."
                }
                actionLabel={hasActiveFilters ? "Clear Filters" : "+ Add employee"}
                onAction={hasActiveFilters ? clearFilters : () => setIsAddOpen(true)}
                icon="👥"
              />
            )}
          </div>
        </div>

        {/* Add / Edit Employee Modal */}
        <EmployeeModal
          isOpen={isAddOpen || Boolean(editingEmployee)}
          onClose={() => {
            setIsAddOpen(false);
            setEditingEmployee(null);
          }}
          employeeToEdit={editingEmployee}
          onSaved={() => loadData()}
        />

        {/* View Employee Details Modal */}
        <EmployeeDetailsModal
          isOpen={Boolean(viewingEmployee)}
          onClose={() => setViewingEmployee(null)}
          employee={viewingEmployee}
          onEdit={(emp) => setEditingEmployee(emp)}
          onDelete={(emp) => setDeletingEmployee(emp)}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deletingEmployee)}
          onClose={() => setDeletingEmployee(null)}
          onConfirm={handleDelete}
          title="Delete Employee"
          message={`Are you sure you want to remove "${deletingEmployee?.name}"? They will no longer be listed in team directories.`}
          confirmLabel="Delete User"
        />
      </AppShell>
    </ProtectedPage>
  );
}
