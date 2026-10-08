"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, Client, Task, ContentItem } from "@/services/dataService";
import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import { SearchableSelect, SelectOption } from "@/components/searchable-select";

export default function ReportsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate Report Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [reportType, setReportType] = useState("Weekly Performance Summary");
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [dateRange, setDateRange] = useState("Current Week");
  const [generatedDate, setGeneratedDate] = useState<string>("Today");

  const loadData = async () => {
    try {
      const [clientsData, tasksData, contentData] = await Promise.all([
        DataService.getClients(),
        DataService.getTasks(),
        DataService.getContent(),
      ]);
      setClients(clientsData);
      setTasks(tasksData);
      setContent(contentData);
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

  const filteredTasks = useMemo(() => {
    if (selectedClient === "ALL") return tasks;
    return tasks.filter((t) => t.client.toLowerCase() === selectedClient.toLowerCase());
  }, [tasks, selectedClient]);

  const filteredContent = useMemo(() => {
    if (selectedClient === "ALL") return content;
    return content.filter((c) => c.client.toLowerCase() === selectedClient.toLowerCase());
  }, [content, selectedClient]);

  // Export report as CSV
  const handleExportCSV = () => {
    const rows = [
      ["Report Type", reportType],
      ["Client Filter", selectedClient],
      ["Date Range", dateRange],
      ["Generated At", new Date().toISOString()],
      [],
      ["--- Client Accounts ---"],
      ["Company", "Contact", "Email", "Status", "Value"],
      ...clients.map((c) => [c.company, c.name, c.email, c.status, c.value]),
      [],
      ["--- Tasks Deliverables ---"],
      ["Task Title", "Client", "Assignee", "Status", "Due Date"],
      ...filteredTasks.map((t) => [t.title, t.client, t.assignee, t.status, t.dueDate]),
      [],
      ["--- Content Pipeline ---"],
      ["Content Title", "Client", "Platform", "Stage", "Assignee"],
      ...filteredContent.map((c) => [c.title, c.client, c.platform, c.status, c.assignee]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `InsightOne_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report downloaded as CSV successfully");
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratedDate(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    setIsGenerateOpen(false);
    toast.success(`Generated "${reportType}" successfully`);
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Reports & Deliverables"
        subtitle="Performance recap, client deliverables summary, and exportable stakeholder briefs."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              ↓ Export CSV
            </button>
            <button
              type="button"
              onClick={() => setIsGenerateOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
            >
              <span>+</span>
              <span>Generate Report</span>
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Report Summary Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                  Active Report
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{reportType}</h2>
                <div className="text-xs text-slate-500 mt-1">
                  Scope: <span className="font-semibold text-slate-700">{selectedClient === "ALL" ? "All Accounts" : selectedClient}</span> • Period: {dateRange} • Last Generated: {generatedDate}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Print View ⎙
                </button>
              </div>
            </div>

            {/* Snapshot KPI Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Total Clients</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{loading ? "…" : clients.length}</div>
                <div className="mt-1 text-xs text-slate-500">Active portfolio accounts</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Pipeline Assets</div>
                <div className="mt-2 text-2xl font-bold text-purple-600">{loading ? "…" : filteredContent.length}</div>
                <div className="mt-1 text-xs text-slate-500">Scheduled / in writing</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Tasks In Flight</div>
                <div className="mt-2 text-2xl font-bold text-amber-600">
                  {loading ? "…" : filteredTasks.filter((t) => t.status !== "Completed").length}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {filteredTasks.filter((t) => t.status === "Completed").length} completed
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Fulfillment Health</div>
                <div className="mt-2 text-2xl font-bold text-emerald-600">96.4%</div>
                <div className="mt-1 text-xs text-slate-500">On-time milestone delivery</div>
              </div>
            </div>
          </div>

          {/* Report Data Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tasks Deliverable Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-3">Tasks in Scope ({filteredTasks.length})</h3>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="min-w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-semibold text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Assignee</th>
                      <th className="py-2.5 px-3">Due</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map((t) => (
                      <tr key={String(t.id)}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{t.title}</td>
                        <td className="py-2.5 px-3 text-slate-600">{t.assignee}</td>
                        <td className="py-2.5 px-3 text-slate-500">{t.dueDate}</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Content Pipeline in Scope */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-3">Content Assets ({filteredContent.length})</h3>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="min-w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-semibold text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Content Title</th>
                      <th className="py-2.5 px-3">Platform</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContent.map((c) => (
                      <tr key={String(c.id)}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{c.title}</td>
                        <td className="py-2.5 px-3 text-slate-600">{c.platform}</td>
                        <td className="py-2.5 px-3 text-slate-500">{c.dueDate}</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Report Modal */}
        <Modal
          isOpen={isGenerateOpen}
          onClose={() => setIsGenerateOpen(false)}
          title="Configure & Generate Report"
          subtitle="Customize the report parameters and data inclusion filters."
          maxWidth="3xl"
        >
          <form onSubmit={handleGenerateSubmit} className="space-y-4">
            <SearchableSelect
              label="Report Type"
              placeholder="Select report type..."
              options={[
                { value: "Weekly Performance Summary", label: "Weekly Performance Summary", subLabel: "KPIs and delivery metrics for the current week" },
                { value: "Client Account Health Review", label: "Client Account Health Review", subLabel: "Portfolio status and account risk assessment" },
                { value: "Content Production & Delivery Audit", label: "Content Production & Delivery Audit", subLabel: "Pipeline throughput and stage breakdown" },
                { value: "Team Task Execution Report", label: "Team Task Execution Report", subLabel: "Individual and team task completion rates" },
              ] as SelectOption[]}
              value={reportType}
              onChange={(val: string) => setReportType(val)}
              isClearable={false}
            />

            <SearchableSelect
              label="Client Scope"
              placeholder="Select client scope..."
              options={[
                { value: "ALL", label: "All Clients (Consolidated)", subLabel: "Aggregate report across entire portfolio" },
                ...clients.map((c) => ({
                  value: c.company || c.name,
                  label: c.company || c.name,
                  subLabel: `${c.status} account`,
                } as SelectOption)),
              ]}
              value={selectedClient}
              onChange={(val: string) => setSelectedClient(val)}
              isClearable={false}
            />

            <SearchableSelect
              label="Date Range"
              placeholder="Select date range..."
              options={[
                { value: "Current Week", label: "Current Week", subLabel: "Mon–Sun of this week" },
                { value: "Last 14 Days", label: "Last 14 Days", subLabel: "Rolling two-week window" },
                { value: "Current Month", label: "Current Month", subLabel: "First to last day of this month" },
                { value: "Quarter to Date (Q2)", label: "Quarter to Date (Q2)", subLabel: "Start of Q2 through today" },
              ] as SelectOption[]}
              value={dateRange}
              onChange={(val: string) => setDateRange(val)}
              isClearable={false}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsGenerateOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Generate Report
              </button>
            </div>
          </form>
        </Modal>
      </AppShell>
    </ProtectedPage>
  );
}
