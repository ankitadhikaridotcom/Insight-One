export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "teal" | "blue" | "amber" | "rose" | "slate";
};

export type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Away" | "On Leave";
};

export type Client = {
  id: number;
  name: string;
  company: string;
  contact: string;
  status: "Active" | "Prospect" | "At Risk";
  value: string;
};

export type ContentItem = {
  id: number;
  title: string;
  client: string;
  assignee: string;
  status: "Idea" | "Topic Approval" | "Writing" | "Review" | "Design" | "Client Approval" | "Schedule" | "Publish";
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  platform: string;
};

export type Task = {
  id: number;
  title: string;
  assignee: string;
  client: string;
  priority: "Low" | "Medium" | "High";
  status: "To Do" | "In Progress" | "Blocked" | "Completed";
  dueDate: string;
};

export type NetworkingEntry = {
  id: number;
  person: string;
  company: string;
  contact: string;
  date: string;
  type: "Coffee" | "Call" | "Conference" | "Partnership";
  status: "Planned" | "Connected" | "Follow-up";
  notes?: string;
};

export type EngagementEntry = {
  id: number;
  client: string;
  platform: string;
  date: string;
  metrics: string;
  notes: string;
  performance: "Growing" | "Strong" | "Above benchmark";
};

export type CalendarEvent = {
  id: number;
  title: string;
  date: string;
  type: "Meeting" | "Content" | "Launch" | "Task";
  detail: string;
};

export const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "▦" },
  { label: "Team", href: "/team", icon: "👥" },
  { label: "Clients", href: "/clients", icon: "🏢" },
  { label: "Projects", href: "/projects", icon: "📁" },
  { label: "Content", href: "/content", icon: "📝" },
  { label: "Tasks", href: "/tasks", icon: "✓" },
  { label: "Networking", href: "/networking", icon: "🌐" },
  { label: "Engagement", href: "/engagement", icon: "◎" },
  { label: "Calendar", href: "/calendar", icon: "◫" },
  { label: "Statistics", href: "/statistics", icon: "▤" },
  { label: "Reports", href: "/reports", icon: "▥" },
  { label: "Settings", href: "/settings", icon: "⚙" },
  { label: "Logout", href: "/login", icon: "↩" },
];

export const dashboardMetrics: DashboardMetric[] = [];
export const employees: Employee[] = [];
export const clients: Client[] = [];
export const pipeline: ContentItem[] = [];
export const tasks: Task[] = [];
export const networkingEntries: NetworkingEntry[] = [];
export const engagementEntries: EngagementEntry[] = [];
export const calendarEvents: CalendarEvent[] = [];
export const performanceTrend: number[] = [];
export const recentActivity: any[] = [];
export const weeklyReportSummary = {
  clients: 0,
  contentPublished: 0,
  engagement: "0%",
  growth: "0%",
};
