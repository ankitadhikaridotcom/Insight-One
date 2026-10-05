export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700",
    Away: "bg-amber-100 text-amber-700",
    "On Leave": "bg-slate-200 text-slate-700",
    Prospect: "bg-sky-100 text-sky-700",
    "At Risk": "bg-rose-100 text-rose-700",
    "To Do": "bg-slate-100 text-slate-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Blocked: "bg-rose-100 text-rose-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Publish: "bg-violet-100 text-violet-700",
    Schedule: "bg-cyan-100 text-cyan-700",
    Review: "bg-indigo-100 text-indigo-700",
    Writing: "bg-amber-100 text-amber-700",
    Idea: "bg-fuchsia-100 text-fuchsia-700",
    "Topic Approval": "bg-teal-100 text-teal-700",
    "Client Approval": "bg-orange-100 text-orange-700",
    Design: "bg-pink-100 text-pink-700",
    Connected: "bg-emerald-100 text-emerald-700",
    "Follow-up": "bg-amber-100 text-amber-700",
    Planned: "bg-sky-100 text-sky-700",
    High: "bg-rose-100 text-rose-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-emerald-100 text-emerald-700",
  };

  const tone = colors[status] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}
