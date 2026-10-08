"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, CONTENT_STAGES } from "@/services/dataService";
import { useToast } from "@/components/toast";
import { SearchableSelect, SelectOption } from "@/components/searchable-select";

export default function StatisticsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeEmployees: 0,
    pendingTasks: 0,
    contentInPipeline: 0,
    scheduledContent: 0,
    publishedContent: 0,
  });
  const [clients, setClients] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("ALL");

  const loadData = async () => {
    try {
      const [statsData, clientsData, contentData, tasksData, engagementData] = await Promise.all([
        DataService.getDashboardStats(),
        DataService.getClients(),
        DataService.getContent(),
        DataService.getTasks(),
        DataService.getEngagement(),
      ]);
      setStats(statsData);
      setClients(clientsData);
      setContent(contentData);
      setTasks(tasksData);
      setEngagement(engagementData);
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

  // Client status breakdown
  const clientBreakdown = useMemo(() => {
    const active = clients.filter((c) => c.status === "Active").length;
    const prospect = clients.filter((c) => c.status === "Prospect").length;
    const atRisk = clients.filter((c) => c.status === "At Risk").length;
    return { active, prospect, atRisk };
  }, [clients]);

  // Task status breakdown
  const taskBreakdown = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const toDo = tasks.filter((t) => t.status === "To Do").length;
    const blocked = tasks.filter((t) => t.status === "Blocked").length;
    return { completed, inProgress, toDo, blocked };
  }, [tasks]);

  // Content stage distribution
  const contentDistribution = useMemo(() => {
    return CONTENT_STAGES.map((stage) => ({
      stage,
      count: content.filter((c) => c.status === stage).length,
    }));
  }, [content]);

  // Export statistics
  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      overview: stats,
      clients: clientBreakdown,
      tasks: taskBreakdown,
      pipeline: contentDistribution,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insightone-statistics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Statistics report exported successfully");
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Statistics & Analytics"
        subtitle="Broad organizational metrics across delivery throughput, pipeline health, and client value."
        actions={
          <div className="flex items-center gap-2">
            <SearchableSelect
              placeholder="Period"
              options={[
                { value: "ALL", label: "All Time" },
                { value: "30D", label: "Last 30 Days" },
                { value: "7D", label: "This Week" },
              ] as SelectOption[]}
              value={period}
              onChange={(val: string) => setPeriod(val ?? "ALL")}
              isClearable={false}
              className="w-36"
            />
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
            >
              <span>↓</span>
              <span>Export Stats</span>
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Overview totals */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Total Accounts</span>
              <div className="mt-2 text-3xl font-bold text-slate-900">{loading ? "…" : stats.totalClients}</div>
              <div className="mt-1 text-xs text-slate-500">
                {clientBreakdown.active} Active • {clientBreakdown.prospect} Prospects
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Active Staff</span>
              <div className="mt-2 text-3xl font-bold text-blue-600">{loading ? "…" : stats.activeEmployees}</div>
              <div className="mt-1 text-xs text-slate-500">Cross-functional team members</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Task Completion Rate</span>
              <div className="mt-2 text-3xl font-bold text-emerald-600">
                {tasks.length > 0 ? `${Math.round((taskBreakdown.completed / tasks.length) * 100)}%` : "0%"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {taskBreakdown.completed} completed of {tasks.length} total
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Published Content</span>
              <div className="mt-2 text-3xl font-bold text-purple-600">{loading ? "…" : stats.publishedContent}</div>
              <div className="mt-1 text-xs text-slate-500">
                {stats.contentInPipeline} items in active production
              </div>
            </div>
          </div>

          {/* Deep Dives */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Content Pipeline 8-Stage Distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Content Pipeline Distribution</h3>
              <p className="text-xs text-slate-500 mb-4">Volume of assets across the 8 BRD content stages.</p>

              <div className="space-y-3">
                {contentDistribution.map(({ stage, count }) => {
                  const maxCount = Math.max(...contentDistribution.map((d) => d.count), 1);
                  const percentage = Math.round((count / maxCount) * 100);

                  return (
                    <div key={stage}>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>{stage}</span>
                        <span>{count} assets</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Delivery Health & Client Breakdown */}
            <div className="space-y-6">
              {/* Task Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Task Delivery Status</h3>
                <p className="text-xs text-slate-500 mb-4">Operational efficiency across commitments.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">To Do</span>
                    <div className="mt-1 text-xl font-bold text-slate-700">{taskBreakdown.toDo}</div>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                    <span className="text-[10px] text-blue-500 font-semibold uppercase">In Progress</span>
                    <div className="mt-1 text-xl font-bold text-blue-700">{taskBreakdown.inProgress}</div>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                    <span className="text-[10px] text-rose-500 font-semibold uppercase">Blocked</span>
                    <div className="mt-1 text-xl font-bold text-rose-700">{taskBreakdown.blocked}</div>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                    <span className="text-[10px] text-emerald-500 font-semibold uppercase">Completed</span>
                    <div className="mt-1 text-xl font-bold text-emerald-700">{taskBreakdown.completed}</div>
                  </div>
                </div>
              </div>

              {/* Client Portfolio Health */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Client Account Health</h3>
                <p className="text-xs text-slate-500 mb-4">Status distribution across the client portfolio.</p>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                    <span className="text-[10px] text-emerald-600 font-semibold uppercase">Active Clients</span>
                    <div className="mt-1 text-xl font-bold text-emerald-700">{clientBreakdown.active}</div>
                  </div>
                  <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                    <span className="text-[10px] text-sky-600 font-semibold uppercase">Prospects</span>
                    <div className="mt-1 text-xl font-bold text-sky-700">{clientBreakdown.prospect}</div>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                    <span className="text-[10px] text-rose-600 font-semibold uppercase">At Risk</span>
                    <div className="mt-1 text-xl font-bold text-rose-700">{clientBreakdown.atRisk}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
