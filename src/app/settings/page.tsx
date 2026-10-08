"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, WorkspaceSettings } from "@/services/dataService";
import { useToast } from "@/components/toast";
import { SearchableSelect, SelectOption } from "@/components/searchable-select";

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<WorkspaceSettings>({
    companyName: "Insight One Technologies",
    domain: "insightone.corp",
    industry: "Enterprise SaaS & Strategic Growth",
    timezone: "America/New_York (UTC-5)",
    currency: "USD ($)",
    dateFormat: "YYYY-MM-DD",
    brandColor: "#0F172A",
    emailUpdates: true,
    slackAlerts: true,
    weeklySummary: true,
    securityAuditAlerts: true,
    enforce2FA: true,
    sessionTimeout: "24h",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSettings(DataService.getSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.companyName.trim()) {
      toast.error("Company name cannot be blank.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      DataService.saveSettings(settings);
      setLoading(false);
      toast.success("Workspace organization settings saved successfully.");
    }, 400);
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Workspace Settings"
        subtitle="Manage organization identity, operational timezones, compliance security policies, and live Supabase cloud connectivity."
        actions={
          <button
            form="settings-form"
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        }
      >
        <form id="settings-form" onSubmit={handleSave} className="space-y-6 max-w-5xl">
          {/* Top Section: Organization Identity & Regional Localization */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Organization Identity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Organization & Brand Identity</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                  Global Tenant
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Legal Entity / Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition"
                  placeholder="e.g. Acme Corporation"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Workspace Custom Domain
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm">
                  <span className="text-slate-400 font-medium">https://</span>
                  <input
                    type="text"
                    value={settings.domain || "insightone.corp"}
                    onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
                    className="flex-1 bg-transparent px-1 text-slate-800 outline-none font-medium"
                    placeholder="company.domain"
                  />
                  <span className="text-slate-400 font-medium">.app</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Primary Industry
                  </label>
                  <SearchableSelect
                    placeholder="Select industry..."
                    options={[
                      { value: "Enterprise SaaS & Strategic Growth", label: "Enterprise SaaS & AI" },
                      { value: "Management Consulting", label: "Management Consulting" },
                      { value: "Media & Creative Production", label: "Media & Creative Production" },
                      { value: "Financial Services & Fintech", label: "Financial Services & Fintech" },
                      { value: "Healthcare & Biotechnology", label: "Healthcare & Biotechnology" },
                      { value: "Logistics & Supply Chain", label: "Logistics & Supply Chain" },
                    ] as SelectOption[]}
                    value={settings.industry || "Enterprise SaaS & Strategic Growth"}
                    onChange={(val: string) => setSettings({ ...settings, industry: val })}
                    isClearable={false}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Brand Color Accent
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.brandColor || "#0F172A"}
                      onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                      className="h-9 w-10 rounded-xl border border-slate-200 bg-slate-50 p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.brandColor}
                      onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Regional & Localization Preferences */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Regional & Localization</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                  Locale Settings
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Primary Operating Timezone
                </label>
                <SearchableSelect
                  placeholder="Select timezone..."
                  options={[
                    { value: "America/New_York (UTC-5)", label: "Eastern Time – US & Canada (UTC-05:00)" },
                    { value: "America/Chicago (UTC-6)", label: "Central Time – US & Canada (UTC-06:00)" },
                    { value: "America/Denver (UTC-7)", label: "Mountain Time – US & Canada (UTC-07:00)" },
                    { value: "America/Los_Angeles (UTC-8)", label: "Pacific Time – US & Canada (UTC-08:00)" },
                    { value: "Europe/London (UTC+0)", label: "London, Edinburgh (UTC+00:00)" },
                    { value: "Europe/Berlin (UTC+1)", label: "Berlin, Paris, Amsterdam (UTC+01:00)" },
                    { value: "Asia/Dubai (UTC+4)", label: "Dubai, Abu Dhabi (UTC+04:00)" },
                    { value: "Asia/Kolkata (UTC+5:30)", label: "India Standard Time (UTC+05:30)" },
                    { value: "Asia/Singapore (UTC+8)", label: "Singapore, Hong Kong (UTC+08:00)" },
                    { value: "Asia/Tokyo (UTC+9)", label: "Tokyo, Seoul (UTC+09:00)" },
                  ] as SelectOption[]}
                  value={settings.timezone || "America/New_York (UTC-5)"}
                  onChange={(val: string) => setSettings({ ...settings, timezone: val })}
                  isClearable={false}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Default Currency
                  </label>
                  <SearchableSelect
                    placeholder="Select currency..."
                    options={[
                      { value: "USD ($)", label: "USD ($)" },
                      { value: "EUR (€)", label: "EUR (€)" },
                      { value: "GBP (£)", label: "GBP (£)" },
                      { value: "CAD ($)", label: "CAD ($)" },
                      { value: "AUD ($)", label: "AUD ($)" },
                      { value: "SGD ($)", label: "SGD ($)" },
                      { value: "INR (₹)", label: "INR (₹)" },
                    ] as SelectOption[]}
                    value={settings.currency || "USD ($)"}
                    onChange={(val: string) => setSettings({ ...settings, currency: val })}
                    isClearable={false}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Date Display Format
                  </label>
                  <SearchableSelect
                    placeholder="Select date format..."
                    options={[
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK / EU)" },
                    ] as SelectOption[]}
                    value={settings.dateFormat || "YYYY-MM-DD"}
                    onChange={(val: string) => setSettings({ ...settings, dateFormat: val })}
                    isClearable={false}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">Localization Compliance</span>
                All timestamps, calendar deadlines, and client invoicing amounts will render aligned with your chosen standard.
              </div>
            </div>
          </div>

          {/* Middle Section: Notification & Webhook Integrations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Notifications & Team Broadcasts</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure delivery milestone webhooks, Slack push alerts, and automated managerial reporting.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                Active Channels
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 transition cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Milestone Email Updates</span>
                  <span className="text-xs text-slate-500">Notify client managers on project deliverables and handoffs</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailUpdates}
                  onChange={(e) => setSettings({ ...settings, emailUpdates: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer ml-3"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 transition cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Slack Webhook Broadcasts</span>
                  <span className="text-xs text-slate-500">Stream pipeline stage transitions to internal team channels</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.slackAlerts}
                  onChange={(e) => setSettings({ ...settings, slackAlerts: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer ml-3"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 transition cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Executive Monday Digest</span>
                  <span className="text-xs text-slate-500">Automated weekly performance, tasks, and KPI executive briefing</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.weeklySummary}
                  onChange={(e) => setSettings({ ...settings, weeklySummary: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer ml-3"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 transition cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Security Audit Logging Alerts</span>
                  <span className="text-xs text-slate-500">Instant notification on role elevation and authentication anomalies</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.securityAuditAlerts ?? true}
                  onChange={(e) => setSettings({ ...settings, securityAuditAlerts: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer ml-3"
                />
              </label>
            </div>
          </div>

          {/* Infrastructure Section: Supabase Cloud Database & Security Policies */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Supabase Cloud Backend Infrastructure */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-slate-900">Database & Cloud Backend</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  Supabase Cloud
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-slate-500 font-medium">Database Engine:</span>
                  <span className="font-semibold text-slate-800">PostgreSQL (Supabase Managed)</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-slate-500 font-medium">Endpoint:</span>
                  <span className="font-mono text-[11px] text-slate-700 font-semibold truncate max-w-[220px]">
                    https://wuzjvcosmzxzmskrqfap.supabase.co
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-slate-500 font-medium">Data Encryption:</span>
                  <span className="font-semibold text-emerald-700">AES-256 (Rest) • TLS 1.3 (In Transit)</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-slate-500 font-medium">Row Level Security (RLS):</span>
                  <span className="font-semibold text-slate-800">Enforced on all 10 Schema Tables</span>
                </div>
              </div>
            </div>

            {/* Enterprise Security & Access Controls */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Security & Access Policy</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                  Enterprise RBAC
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Inactivity Session Expiry Policy
                </label>
                <SearchableSelect
                  placeholder="Select session timeout..."
                  options={[
                    { value: "1h", label: "1 Hour", subLabel: "High Security / Financial Compliance" },
                    { value: "8h", label: "8 Hours", subLabel: "Standard Working Day Shift" },
                    { value: "24h", label: "24 Hours", subLabel: "Recommended for Enterprise Teams" },
                    { value: "7d", label: "7 Days", subLabel: "Extended Remember Session" },
                  ] as SelectOption[]}
                  value={settings.sessionTimeout || "24h"}
                  onChange={(val: string) => setSettings({ ...settings, sessionTimeout: val })}
                  isClearable={false}
                />
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-slate-800 block">Enforce Two-Factor Authentication (2FA)</span>
                    <span className="text-xs text-slate-400">Require multi-factor TOTP for all administrator roles</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enforce2FA ?? true}
                    onChange={(e) => setSettings({ ...settings, enforce2FA: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">
              Changes apply across all active workspaces and team member sessions.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? "Saving settings..." : "Save Workspace Settings"}
            </button>
          </div>
        </form>
      </AppShell>
    </ProtectedPage>
  );
}
