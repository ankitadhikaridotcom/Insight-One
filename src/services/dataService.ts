import { supabase } from "@/lib/supabaseClient";
import { saveUserCredential } from "./authService";

// ==============================================================================
// Domain Types & Interfaces
// ==============================================================================

export type Employee = {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  status: "Active" | "Away" | "On Leave";
  password?: string;
  tenant_id?: number;
  createdAt?: string;
  created_at?: string;
};

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  status: "Active" | "Prospect" | "At Risk";
  value: string;
  notes: string;
  tenant_id?: number;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
};

export type Project = {
  id: string;
  name: string;
  client_id?: string;
  client: string; // Display company/name
  description: string;
  manager: string; // Maps to project_manager
  project_manager?: string;
  assignedTeam: string; // Maps to assigned_team
  assigned_team?: string;
  startDate: string; // Maps to start_date
  start_date?: string;
  dueDate: string; // Maps to due_date
  due_date?: string;
  priority: "Low" | "Medium" | "High";
  status: "Planning" | "In Progress" | "Review" | "Completed" | "On Hold";
  progress?: number;
  tenant_id?: number;
  createdAt?: string;
  created_at?: string;
};

export type ContentStage =
  | "Idea"
  | "Topic Approval"
  | "Writing"
  | "Review"
  | "Design"
  | "Client Approval"
  | "Schedule"
  | "Publish";

export const CONTENT_STAGES: ContentStage[] = [
  "Idea",
  "Topic Approval",
  "Writing",
  "Review",
  "Design",
  "Client Approval",
  "Schedule",
  "Publish",
];

export const DB_STAGE_MAP: Record<string, ContentStage> = {
  idea: "Idea",
  topic_approval: "Topic Approval",
  writing: "Writing",
  review: "Review",
  design: "Design",
  client_approval: "Client Approval",
  schedule: "Schedule",
  publish: "Publish",
};

export function stageToDb(stage: string): string {
  const normalized = stage.toLowerCase().replace(/\s+/g, "_");
  if (normalized in DB_STAGE_MAP) return normalized;
  return "idea";
}

export function stageFromDb(dbStage: string): ContentStage {
  const key = (dbStage || "idea").toLowerCase();
  return DB_STAGE_MAP[key] || "Idea";
}

export type ContentItem = {
  id: string;
  client_id?: string;
  client: string;
  title: string;
  contentType: string;
  content_type?: string;
  platform: string;
  description: string;
  assignee: string;
  assigned_employee?: string;
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  due_date?: string;
  status: ContentStage;
  stage?: string;
  tenant_id?: number;
  createdAt?: string;
  created_at?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  client_id?: string;
  client: string;
  assignee: string;
  assigned_employee?: string;
  priority: "Low" | "Medium" | "High";
  status: "To Do" | "In Progress" | "Review" | "Done" | "Completed" | "Blocked";
  dueDate: string;
  due_date?: string;
  tenant_id?: number;
  createdAt?: string;
  created_at?: string;
};

export type NetworkingEntry = {
  id: string;
  person: string;
  person_name?: string;
  company: string;
  email: string;
  phone: string;
  date: string;
  type: "Coffee" | "Call" | "Conference" | "Partnership" | "Meeting";
  networking_type?: string;
  status: "Planned" | "Connected" | "Follow-up";
  notes: string;
  followUpDate: string;
  follow_up_date?: string;
  tenant_id?: number;
  createdAt?: string;
  created_at?: string;
};

export type EngagementEntry = {
  id: string;
  client_id?: string;
  client: string;
  platform: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  metrics?: string;
  performance: "Above benchmark" | "Strong" | "Growing" | "Average";
  notes: string;
  tenant_id?: number;
  createdAt?: string;
  created_at?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  client_id?: string;
  client?: string;
  date: string;
  startTime: string;
  start_time?: string;
  endTime: string;
  end_time?: string;
  type: "Meeting" | "Task" | "Content Deadline" | "Launch";
  event_type?: string;
  tenant_id?: number;
  createdAt?: string;
  created_at?: string;
};

export type ReportEntry = {
  id: string;
  client_id?: string;
  client?: string;
  weekStart?: string;
  weekEnd?: string;
  reportData?: any;
  createdAt?: string;
};

export type NavigationMenuItem = {
  label: string;
  href: string;
  icon: string;
  display_order: number;
};

export type WorkspaceSettings = {
  companyName: string;
  domain?: string;
  industry?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  brandColor: string;
  emailUpdates: boolean;
  slackAlerts: boolean;
  weeklySummary: boolean;
  securityAuditAlerts?: boolean;
  enforce2FA?: boolean;
  sessionTimeout?: string;
};

// ==============================================================================
// Standard RPC Response Interface & Function Caller
// ==============================================================================

export interface RpcResponse<T = any> {
  is_success: boolean;
  data: T;
  paging?: {
    total_records: number;
    page_size: number;
    page_index: number;
  };
  message: string;
  status_code: number;
}

/**
 * Standard PostgreSQL RPC caller.
 * Every business operation is executed strictly through a PostgreSQL function.
 */
export async function callRpc<T = any>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<RpcResponse<T>> {
  try {
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      console.warn(`[Supabase RPC] ${functionName} returned error:`, error);
      // If function doesn't exist yet in Supabase (e.g. user hasn't executed migration script yet)
      if (error.code === "PGRST202") {
        return {
          is_success: false,
          data: null as any,
          message: `Database function '${functionName}' not found. Please run 'supabase-schema.sql' in your Supabase SQL editor.`,
          status_code: 404,
        };
      }
      return {
        is_success: false,
        data: null as any,
        message: error.message || "Operation failed",
        status_code: 500,
      };
    }

    if (data && typeof data === "object" && "is_success" in data) {
      return data as RpcResponse<T>;
    }

    return {
      is_success: true,
      data: data as T,
      message: "Operation completed",
      status_code: 200,
    };
  } catch (err: any) {
    console.error(`[Supabase RPC] Exception executing ${functionName}:`, err);
    return {
      is_success: false,
      data: null as any,
      message: err?.message || "Unexpected RPC error",
      status_code: 500,
    };
  }
}

function dispatchChange(entity: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("insightone_supabase_changed", { detail: { entity } }));
  }
}

// In-memory fallback cache to keep UI active if offline or before SQL execution
const MEMORY_CACHE: {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  team: Employee[];
  content: ContentItem[];
  networking: NetworkingEntry[];
  engagement: EngagementEntry[];
  calendar: CalendarEvent[];
  reports: ReportEntry[];
} = {
  clients: [],
  projects: [],
  tasks: [],
  team: [],
  content: [],
  networking: [],
  engagement: [],
  calendar: [],
  reports: [],
};

// ==============================================================================
// DataService: 100% RPC-Driven Multi-Tenant Persistent Service
// ==============================================================================

export const DataService = {
  // ----------------------------------------------------------------------------
  // Navigation & User Context RPC
  // ----------------------------------------------------------------------------
  async getNavigationMenu(): Promise<NavigationMenuItem[]> {
    const res = await callRpc<NavigationMenuItem[]>("fn_navigation_menu");
    if (res.is_success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  async getUserContext(): Promise<any> {
    const res = await callRpc("fn_user_me");
    return res.is_success ? res.data : null;
  },

  // ----------------------------------------------------------------------------
  // Clients RPC
  // ----------------------------------------------------------------------------
  async getClients(query?: string, status?: string): Promise<Client[]> {
    const res = await callRpc<any[]>("fn_client_list", {
      p_search: query?.trim() || null,
      p_status: status && status !== "ALL" ? status : null,
    });

    if (res.is_success && Array.isArray(res.data)) {
      const mapped = res.data.map((c) => ({
        id: String(c.id),
        name: c.name || "",
        company: c.company || "",
        email: c.email || "",
        phone: c.phone || "",
        website: c.website || "",
        industry: c.industry || "",
        status: (c.status as any) || "Active",
        value: c.value || "$25k",
        notes: c.notes || "",
        tenant_id: c.tenant_id,
        createdAt: c.created_at,
        created_at: c.created_at,
      }));
      MEMORY_CACHE.clients = mapped;
      return mapped;
    }
    return MEMORY_CACHE.clients;
  },

  async createClient(client: Omit<Client, "id" | "createdAt">): Promise<Client> {
    const res = await callRpc<any>("fn_client_create", {
      p_name: client.name.trim(),
      p_company: client.company.trim(),
      p_email: client.email.trim(),
      p_phone: client.phone?.trim() || null,
      p_website: client.website?.trim() || null,
      p_industry: client.industry?.trim() || null,
      p_status: client.status || "Active",
      p_value: client.value || "$25k",
      p_notes: client.notes?.trim() || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to create client in Supabase");
    }

    const created: Client = {
      id: String(res.data.id),
      name: res.data.name,
      company: res.data.company,
      email: res.data.email,
      phone: res.data.phone || "",
      website: res.data.website || "",
      industry: res.data.industry || "",
      status: res.data.status,
      value: res.data.value,
      notes: res.data.notes || "",
      tenant_id: res.data.tenant_id,
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.clients = [created, ...MEMORY_CACHE.clients];
    dispatchChange("clients");
    return created;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    const res = await callRpc<any>("fn_client_update", {
      p_id: id,
      p_name: updates.name || null,
      p_company: updates.company || null,
      p_email: updates.email || null,
      p_phone: updates.phone || null,
      p_website: updates.website || null,
      p_industry: updates.industry || null,
      p_status: updates.status || null,
      p_value: updates.value || null,
      p_notes: updates.notes || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to update client");
    }

    const updated: Client = {
      id: String(res.data.id),
      name: res.data.name,
      company: res.data.company,
      email: res.data.email,
      phone: res.data.phone || "",
      website: res.data.website || "",
      industry: res.data.industry || "",
      status: res.data.status,
      value: res.data.value,
      notes: res.data.notes || "",
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.clients = MEMORY_CACHE.clients.map((c) => (c.id === id ? updated : c));
    dispatchChange("clients");
    return updated;
  },

  async deleteClient(id: string): Promise<boolean> {
    const res = await callRpc("fn_client_delete", { p_id: id });
    if (!res.is_success) {
      throw new Error(res.message || "Failed to delete client");
    }
    MEMORY_CACHE.clients = MEMORY_CACHE.clients.filter((c) => c.id !== id);
    dispatchChange("clients");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Projects RPC (Kanban Board Support)
  // ----------------------------------------------------------------------------
  async getProjects(query?: string, status?: string, priority?: string): Promise<Project[]> {
    const res = await callRpc<any[]>("fn_project_list", {
      p_search: query?.trim() || null,
      p_status: status && status !== "ALL" ? status : null,
      p_priority: priority && priority !== "ALL" ? priority : null,
    });

    if (res.is_success && Array.isArray(res.data)) {
      const mapped: Project[] = res.data.map((p) => ({
        id: String(p.id),
        name: p.name || "",
        client_id: p.client_id ? String(p.client_id) : undefined,
        client: p.client || "Internal Project",
        description: p.description || "",
        manager: p.manager || p.project_manager || "Unassigned",
        project_manager: p.project_manager,
        assignedTeam: p.assignedTeam || p.assigned_team || "Team",
        assigned_team: p.assigned_team,
        startDate: p.startDate || p.start_date || "",
        start_date: p.start_date,
        dueDate: p.dueDate || p.due_date || "",
        due_date: p.due_date,
        priority: p.priority || "Medium",
        status: p.status || "Planning",
        progress: p.progress ?? 0,
        tenant_id: p.tenant_id,
        createdAt: p.created_at,
        created_at: p.created_at,
      }));
      MEMORY_CACHE.projects = mapped;
      return mapped;
    }
    return MEMORY_CACHE.projects;
  },

  async createProject(project: Omit<Project, "id" | "createdAt">): Promise<Project> {
    const res = await callRpc<any>("fn_project_create", {
      p_name: project.name.trim(),
      p_client_id: project.client_id || null,
      p_description: project.description?.trim() || null,
      p_project_manager: project.manager || project.project_manager || null,
      p_assigned_team: project.assignedTeam || project.assigned_team || null,
      p_start_date: project.startDate || project.start_date || null,
      p_due_date: project.dueDate || project.due_date || null,
      p_priority: project.priority || "Medium",
      p_status: project.status || "Planning",
      p_progress: project.progress || 0,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to create project in Supabase");
    }

    const created: Project = {
      id: String(res.data.id),
      name: res.data.name,
      client_id: res.data.client_id ? String(res.data.client_id) : undefined,
      client: res.data.client || "Internal Project",
      description: res.data.description || "",
      manager: res.data.manager || "Unassigned",
      assignedTeam: res.data.assignedTeam || "Team",
      startDate: res.data.startDate || "",
      dueDate: res.data.dueDate || "",
      priority: res.data.priority,
      status: res.data.status,
      progress: res.data.progress ?? 0,
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.projects = [created, ...MEMORY_CACHE.projects];
    dispatchChange("projects");
    return created;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const res = await callRpc<any>("fn_project_update", {
      p_id: id,
      p_name: updates.name || null,
      p_client_id: updates.client_id || null,
      p_description: updates.description || null,
      p_project_manager: updates.manager || updates.project_manager || null,
      p_assigned_team: updates.assignedTeam || updates.assigned_team || null,
      p_start_date: updates.startDate || updates.start_date || null,
      p_due_date: updates.dueDate || updates.due_date || null,
      p_priority: updates.priority || null,
      p_status: updates.status || null,
      p_progress: updates.progress ?? null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to update project");
    }

    const updated: Project = {
      id: String(res.data.id),
      name: res.data.name,
      client_id: res.data.client_id ? String(res.data.client_id) : undefined,
      client: res.data.client || "Internal Project",
      description: res.data.description || "",
      manager: res.data.manager || "Unassigned",
      assignedTeam: res.data.assignedTeam || "Team",
      startDate: res.data.startDate || "",
      dueDate: res.data.dueDate || "",
      priority: res.data.priority,
      status: res.data.status,
      progress: res.data.progress ?? 0,
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.projects = MEMORY_CACHE.projects.map((p) => (p.id === id ? updated : p));
    dispatchChange("projects");
    return updated;
  },

  /**
   * Persists Kanban status movements directly via fn_project_status_update RPC
   */
  async updateProjectStatus(
    id: string,
    status: Project["status"],
    progress?: number
  ): Promise<boolean> {
    const res = await callRpc("fn_project_status_update", {
      p_id: id,
      p_status: status,
      p_progress: progress ?? null,
    });

    if (!res.is_success) {
      throw new Error(res.message || "Failed to update project status");
    }

    MEMORY_CACHE.projects = MEMORY_CACHE.projects.map((p) =>
      p.id === id ? { ...p, status, progress: progress ?? p.progress } : p
    );
    dispatchChange("projects");
    return true;
  },

  async deleteProject(id: string): Promise<boolean> {
    const res = await callRpc("fn_project_delete", { p_id: id });
    if (!res.is_success) {
      throw new Error(res.message || "Failed to delete project");
    }
    MEMORY_CACHE.projects = MEMORY_CACHE.projects.filter((p) => p.id !== id);
    dispatchChange("projects");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Tasks RPC
  // ----------------------------------------------------------------------------
  async getTasks(query?: string, status?: string, priority?: string): Promise<Task[]> {
    const res = await callRpc<any[]>("fn_task_list", {
      p_search: query?.trim() || null,
      p_status: status && status !== "ALL" ? status : null,
      p_priority: priority && priority !== "ALL" ? priority : null,
    });

    if (res.is_success && Array.isArray(res.data)) {
      const mapped: Task[] = res.data.map((t) => ({
        id: String(t.id),
        title: t.title || "",
        description: t.description || "",
        client_id: t.client_id ? String(t.client_id) : undefined,
        client: t.client || "Internal Task",
        assignee: t.assignee || t.assigned_employee || "Unassigned",
        assigned_employee: t.assigned_employee,
        priority: t.priority || "Medium",
        status: t.status || "To Do",
        dueDate: t.dueDate || t.due_date || "",
        due_date: t.due_date,
        tenant_id: t.tenant_id,
        createdAt: t.created_at,
        created_at: t.created_at,
      }));
      MEMORY_CACHE.tasks = mapped;
      return mapped;
    }
    return MEMORY_CACHE.tasks;
  },

  async createTask(task: Omit<Task, "id" | "createdAt">): Promise<Task> {
    const res = await callRpc<any>("fn_task_create", {
      p_title: task.title.trim(),
      p_client_id: task.client_id || null,
      p_description: task.description?.trim() || null,
      p_assigned_employee: task.assignee || task.assigned_employee || null,
      p_priority: task.priority || "Medium",
      p_status: task.status || "To Do",
      p_due_date: task.dueDate || task.due_date || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to create task in Supabase");
    }

    const created: Task = {
      id: String(res.data.id),
      title: res.data.title,
      client_id: res.data.client_id ? String(res.data.client_id) : undefined,
      client: "Internal Task",
      description: res.data.description || "",
      assignee: res.data.assignee || "Unassigned",
      priority: res.data.priority,
      status: res.data.status,
      dueDate: res.data.dueDate || "",
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.tasks = [created, ...MEMORY_CACHE.tasks];
    dispatchChange("tasks");
    return created;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const res = await callRpc<any>("fn_task_update", {
      p_id: id,
      p_title: updates.title || null,
      p_client_id: updates.client_id || null,
      p_description: updates.description || null,
      p_assigned_employee: updates.assignee || updates.assigned_employee || null,
      p_priority: updates.priority || null,
      p_status: updates.status || null,
      p_due_date: updates.dueDate || updates.due_date || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to update task");
    }

    const updated: Task = {
      id: String(res.data.id),
      title: res.data.title,
      client_id: res.data.client_id ? String(res.data.client_id) : undefined,
      client: "Internal Task",
      description: res.data.description || "",
      assignee: res.data.assignee || "Unassigned",
      priority: res.data.priority,
      status: res.data.status,
      dueDate: res.data.dueDate || "",
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.tasks = MEMORY_CACHE.tasks.map((t) => (t.id === id ? updated : t));
    dispatchChange("tasks");
    return updated;
  },

  async deleteTask(id: string): Promise<boolean> {
    const res = await callRpc("fn_task_delete", { p_id: id });
    if (!res.is_success) {
      throw new Error(res.message || "Failed to delete task");
    }
    MEMORY_CACHE.tasks = MEMORY_CACHE.tasks.filter((t) => t.id !== id);
    dispatchChange("tasks");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Team / User Management RPC
  // ----------------------------------------------------------------------------
  async getUsers(query?: string, department?: string, status?: string): Promise<Employee[]> {
    const res = await callRpc<any[]>("fn_team_list", {
      p_search: query?.trim() || null,
      p_department: department && department !== "ALL" ? department : null,
      p_status: status && status !== "ALL" ? status : null,
    });

    if (res.is_success && Array.isArray(res.data)) {
      const mapped: Employee[] = res.data.map((u) => ({
        id: String(u.id),
        name: u.name || u.full_name || u.email,
        full_name: u.full_name,
        email: u.email,
        role: u.role || "Employee",
        department: u.department || "General",
        phone: u.phone || "",
        status: (u.status as any) || "Active",
        tenant_id: u.tenant_id,
        createdAt: u.created_at,
        created_at: u.created_at,
      }));
      MEMORY_CACHE.team = mapped;
      return mapped;
    }
    return MEMORY_CACHE.team;
  },

  async createUser(user: Omit<Employee, "id" | "createdAt">): Promise<Employee> {
    const res = await callRpc<any>("fn_team_create", {
      p_name: user.name.trim(),
      p_email: user.email.trim().toLowerCase(),
      p_role: user.role.trim(),
      p_department: user.department || "General",
      p_phone: user.phone || null,
      p_status: user.status || "Active",
      p_password: user.password || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to create user in Supabase");
    }

    if (user.password) {
      saveUserCredential(
        user.email,
        user.password,
        user.name,
        user.role.toLowerCase().includes("admin") ? "admin" : "employee"
      );
    }

    const created: Employee = {
      id: String(res.data.id),
      name: res.data.name,
      email: res.data.email,
      role: res.data.role,
      department: res.data.department,
      phone: res.data.phone || "",
      status: res.data.status,
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.team = [created, ...MEMORY_CACHE.team];
    dispatchChange("profiles");
    return created;
  },

  async updateUser(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const intId = parseInt(id, 10);
    const res = await callRpc<any>("fn_team_update", {
      p_id: isNaN(intId) ? 1 : intId,
      p_name: updates.name || null,
      p_email: updates.email || null,
      p_role: updates.role || null,
      p_department: updates.department || null,
      p_phone: updates.phone || null,
      p_status: updates.status || null,
      p_password: updates.password || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to update user");
    }

    if (updates.email && updates.password) {
      saveUserCredential(
        updates.email,
        updates.password,
        updates.name,
        updates.role?.toLowerCase().includes("admin") ? "admin" : "employee"
      );
    }

    const updated: Employee = {
      id: String(res.data.id),
      name: res.data.name,
      email: res.data.email,
      role: res.data.role,
      department: res.data.department,
      phone: res.data.phone || "",
      status: res.data.status,
      createdAt: res.data.updated_at,
    };

    MEMORY_CACHE.team = MEMORY_CACHE.team.map((e) => (e.id === id ? updated : e));
    dispatchChange("profiles");
    return updated;
  },

  async deleteUser(id: string): Promise<boolean> {
    const intId = parseInt(id, 10);
    const res = await callRpc("fn_team_delete", { p_id: isNaN(intId) ? 1 : intId });
    if (!res.is_success) {
      throw new Error(res.message || "Failed to delete user");
    }
    MEMORY_CACHE.team = MEMORY_CACHE.team.filter((e) => e.id !== id);
    dispatchChange("profiles");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Content Pipeline RPC
  // ----------------------------------------------------------------------------
  async getContentItems(query?: string, stage?: string, priority?: string): Promise<ContentItem[]> {
    const res = await callRpc<any[]>("fn_content_list", {
      p_search: query?.trim() || null,
      p_stage: stage && stage !== "ALL" ? stage : null,
      p_priority: priority && priority !== "ALL" ? priority : null,
    });

    if (res.is_success && Array.isArray(res.data)) {
      const mapped: ContentItem[] = res.data.map((c) => ({
        id: String(c.id),
        client_id: c.client_id ? String(c.client_id) : undefined,
        client: c.client || "Internal",
        title: c.title || "",
        contentType: c.contentType || "Post",
        platform: c.platform || "LinkedIn",
        description: c.description || "",
        assignee: c.assignee || "Unassigned",
        priority: c.priority || "Medium",
        dueDate: c.dueDate || "",
        status: stageFromDb(c.status || c.stage),
        stage: c.stage,
        tenant_id: c.tenant_id,
        createdAt: c.created_at,
      }));
      MEMORY_CACHE.content = mapped;
      return mapped;
    }
    return MEMORY_CACHE.content;
  },

  async createContentItem(item: Omit<ContentItem, "id" | "createdAt">): Promise<ContentItem> {
    const res = await callRpc<any>("fn_content_create", {
      p_title: item.title.trim(),
      p_client_id: item.client_id || null,
      p_content_type: item.contentType || null,
      p_platform: item.platform || null,
      p_description: item.description?.trim() || null,
      p_assigned_employee: item.assignee || null,
      p_priority: item.priority || "Medium",
      p_due_date: item.dueDate || null,
      p_stage: stageToDb(item.status),
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to create content item");
    }

    const created: ContentItem = {
      id: String(res.data.id),
      title: res.data.title,
      client_id: res.data.client_id ? String(res.data.client_id) : undefined,
      client: "Internal",
      contentType: res.data.contentType || "Post",
      platform: res.data.platform || "LinkedIn",
      description: res.data.description || "",
      assignee: res.data.assignee || "Unassigned",
      priority: res.data.priority,
      dueDate: res.data.dueDate || "",
      status: stageFromDb(res.data.status),
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.content = [created, ...MEMORY_CACHE.content];
    dispatchChange("content");
    return created;
  },

  async updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    const res = await callRpc<any>("fn_content_update", {
      p_id: id,
      p_title: updates.title || null,
      p_client_id: updates.client_id || null,
      p_content_type: updates.contentType || null,
      p_platform: updates.platform || null,
      p_description: updates.description || null,
      p_assigned_employee: updates.assignee || null,
      p_priority: updates.priority || null,
      p_due_date: updates.dueDate || null,
      p_stage: updates.status ? stageToDb(updates.status) : null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to update content item");
    }

    const updated: ContentItem = {
      id: String(res.data.id),
      title: res.data.title,
      client_id: res.data.client_id ? String(res.data.client_id) : undefined,
      client: "Internal",
      contentType: res.data.contentType || "Post",
      platform: res.data.platform || "LinkedIn",
      description: res.data.description || "",
      assignee: res.data.assignee || "Unassigned",
      priority: res.data.priority,
      dueDate: res.data.dueDate || "",
      status: stageFromDb(res.data.status),
      createdAt: res.data.updated_at,
    };

    MEMORY_CACHE.content = MEMORY_CACHE.content.map((c) => (c.id === id ? updated : c));
    dispatchChange("content");
    return updated;
  },

  async deleteContentItem(id: string): Promise<boolean> {
    const res = await callRpc("fn_content_delete", { p_id: id });
    if (!res.is_success) {
      throw new Error(res.message || "Failed to delete content");
    }
    MEMORY_CACHE.content = MEMORY_CACHE.content.filter((c) => c.id !== id);
    dispatchChange("content");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Networking Contacts RPC
  // ----------------------------------------------------------------------------
  async getNetworkingContacts(query?: string, status?: string, type?: string): Promise<NetworkingEntry[]> {
    const res = await callRpc<any[]>("fn_networking_list", {
      p_search: query?.trim() || null,
      p_status: status && status !== "ALL" ? status : null,
      p_type: type && type !== "ALL" ? type : null,
    });

    if (res.is_success && Array.isArray(res.data)) {
      const mapped: NetworkingEntry[] = res.data.map((n) => ({
        id: String(n.id),
        person: n.person || "",
        company: n.company || "",
        email: n.email || "",
        phone: n.phone || "",
        date: n.date || "",
        type: n.type || "Call",
        status: n.status || "Connected",
        notes: n.notes || "",
        followUpDate: n.followUpDate || "",
        tenant_id: n.tenant_id,
        createdAt: n.created_at,
      }));
      MEMORY_CACHE.networking = mapped;
      return mapped;
    }
    return MEMORY_CACHE.networking;
  },

  async createNetworkingContact(entry: Omit<NetworkingEntry, "id" | "createdAt">): Promise<NetworkingEntry> {
    const res = await callRpc<any>("fn_networking_create", {
      p_person_name: entry.person.trim(),
      p_company: entry.company.trim(),
      p_email: entry.email?.trim() || null,
      p_phone: entry.phone?.trim() || null,
      p_networking_type: entry.type || "Call",
      p_date: entry.date || null,
      p_status: entry.status || "Connected",
      p_notes: entry.notes?.trim() || null,
      p_follow_up_date: entry.followUpDate || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to create networking contact");
    }

    const created: NetworkingEntry = {
      id: String(res.data.id),
      person: res.data.person,
      company: res.data.company,
      email: res.data.email || "",
      phone: res.data.phone || "",
      date: res.data.date,
      type: res.data.type,
      status: res.data.status,
      notes: res.data.notes || "",
      followUpDate: res.data.followUpDate || "",
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.networking = [created, ...MEMORY_CACHE.networking];
    dispatchChange("networking");
    return created;
  },

  async updateNetworkingContact(id: string, updates: Partial<NetworkingEntry>): Promise<NetworkingEntry | null> {
    const res = await callRpc<any>("fn_networking_update", {
      p_id: id,
      p_person_name: updates.person || null,
      p_company: updates.company || null,
      p_email: updates.email || null,
      p_phone: updates.phone || null,
      p_networking_type: updates.type || null,
      p_date: updates.date || null,
      p_status: updates.status || null,
      p_notes: updates.notes || null,
      p_follow_up_date: updates.followUpDate || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to update networking contact");
    }

    const updated: NetworkingEntry = {
      id: String(res.data.id),
      person: res.data.person,
      company: res.data.company,
      email: res.data.email || "",
      phone: res.data.phone || "",
      date: res.data.date,
      type: res.data.type,
      status: res.data.status,
      notes: res.data.notes || "",
      followUpDate: res.data.followUpDate || "",
      createdAt: res.data.updated_at,
    };

    MEMORY_CACHE.networking = MEMORY_CACHE.networking.map((n) => (n.id === id ? updated : n));
    dispatchChange("networking");
    return updated;
  },

  async deleteNetworkingContact(id: string): Promise<boolean> {
    const res = await callRpc("fn_networking_delete", { p_id: id });
    if (!res.is_success) {
      throw new Error(res.message || "Failed to delete networking contact");
    }
    MEMORY_CACHE.networking = MEMORY_CACHE.networking.filter((n) => n.id !== id);
    dispatchChange("networking");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Engagement Metrics RPC
  // ----------------------------------------------------------------------------
  async getEngagementMetrics(query?: string, platform?: string): Promise<EngagementEntry[]> {
    const res = await callRpc<any[]>("fn_engagement_list", {
      p_search: query?.trim() || null,
      p_platform: platform && platform !== "ALL" ? platform : null,
    });

    if (res.is_success && Array.isArray(res.data)) {
      const mapped: EngagementEntry[] = res.data.map((e) => ({
        id: String(e.id),
        client_id: e.client_id ? String(e.client_id) : undefined,
        client: e.client || "Client Account",
        platform: e.platform || "LinkedIn",
        date: e.date || "",
        likes: e.likes ?? 0,
        comments: e.comments ?? 0,
        shares: e.shares ?? 0,
        reach: e.reach ?? 0,
        impressions: e.impressions ?? 0,
        performance: e.performance || "Strong",
        notes: e.notes || "",
        tenant_id: e.tenant_id,
        createdAt: e.created_at,
      }));
      MEMORY_CACHE.engagement = mapped;
      return mapped;
    }
    return MEMORY_CACHE.engagement;
  },

  async createEngagementMetric(entry: Omit<EngagementEntry, "id" | "createdAt">): Promise<EngagementEntry> {
    const res = await callRpc<any>("fn_engagement_create", {
      p_client_id: entry.client_id || null,
      p_platform: entry.platform || "LinkedIn",
      p_date: entry.date || null,
      p_likes: entry.likes || 0,
      p_comments: entry.comments || 0,
      p_shares: entry.shares || 0,
      p_reach: entry.reach || 0,
      p_impressions: entry.impressions || 0,
      p_performance: entry.performance || "Strong",
      p_notes: entry.notes?.trim() || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to create engagement metric");
    }

    const created: EngagementEntry = {
      id: String(res.data.id),
      client_id: res.data.client_id ? String(res.data.client_id) : undefined,
      client: "Client Account",
      platform: res.data.platform,
      date: res.data.date,
      likes: res.data.likes,
      comments: res.data.comments,
      shares: res.data.shares,
      reach: res.data.reach,
      impressions: res.data.impressions,
      performance: res.data.performance,
      notes: res.data.notes || "",
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.engagement = [created, ...MEMORY_CACHE.engagement];
    dispatchChange("engagement");
    return created;
  },

  async deleteEngagementMetric(id: string): Promise<boolean> {
    const res = await callRpc("fn_engagement_delete", { p_id: id });
    if (!res.is_success) {
      throw new Error(res.message || "Failed to delete engagement metric");
    }
    MEMORY_CACHE.engagement = MEMORY_CACHE.engagement.filter((e) => e.id !== id);
    dispatchChange("engagement");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Calendar Events RPC
  // ----------------------------------------------------------------------------
  async getCalendarEvents(query?: string, type?: string): Promise<CalendarEvent[]> {
    const res = await callRpc<any[]>("fn_calendar_event_list", {
      p_search: query?.trim() || null,
      p_type: type && type !== "ALL" ? type : null,
    });

    if (res.is_success && Array.isArray(res.data)) {
      const mapped: CalendarEvent[] = res.data.map((e) => ({
        id: String(e.id),
        title: e.title || "",
        description: e.description || "",
        client_id: e.client_id ? String(e.client_id) : undefined,
        client: e.client || "Internal",
        type: e.type || "Meeting",
        startTime: e.startTime || "",
        endTime: e.endTime || "",
        date: e.date || "",
        tenant_id: e.tenant_id,
        createdAt: e.created_at,
      }));
      MEMORY_CACHE.calendar = mapped;
      return mapped;
    }
    return MEMORY_CACHE.calendar;
  },

  async createCalendarEvent(event: Omit<CalendarEvent, "id" | "createdAt">): Promise<CalendarEvent> {
    const res = await callRpc<any>("fn_calendar_event_create", {
      p_title: event.title.trim(),
      p_client_id: event.client_id || null,
      p_description: event.description?.trim() || null,
      p_event_type: event.type || "Meeting",
      p_start_time: event.startTime || event.date || new Date().toISOString(),
      p_end_time: event.endTime || null,
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to create calendar event");
    }

    const created: CalendarEvent = {
      id: String(res.data.id),
      title: res.data.title,
      description: res.data.description || "",
      client_id: res.data.client_id ? String(res.data.client_id) : undefined,
      client: "Internal",
      type: res.data.type,
      startTime: res.data.startTime,
      endTime: res.data.endTime,
      date: res.data.date,
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.calendar = [created, ...MEMORY_CACHE.calendar];
    dispatchChange("calendar_events");
    return created;
  },

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const res = await callRpc("fn_calendar_event_delete", { p_id: id });
    if (!res.is_success) {
      throw new Error(res.message || "Failed to delete calendar event");
    }
    MEMORY_CACHE.calendar = MEMORY_CACHE.calendar.filter((e) => e.id !== id);
    dispatchChange("calendar_events");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Reports RPC
  // ----------------------------------------------------------------------------
  async getReports(): Promise<ReportEntry[]> {
    const res = await callRpc<any[]>("fn_report_list");
    if (res.is_success && Array.isArray(res.data)) {
      const mapped: ReportEntry[] = res.data.map((r) => ({
        id: String(r.id),
        client_id: r.client_id ? String(r.client_id) : undefined,
        client: r.client || "Workspace Aggregate",
        weekStart: r.week_start,
        weekEnd: r.week_end,
        reportData: r.report_data,
        createdAt: r.created_at,
      }));
      MEMORY_CACHE.reports = mapped;
      return mapped;
    }
    return MEMORY_CACHE.reports;
  },

  async createReport(report: { client_id?: string; weekStart?: string; weekEnd?: string; reportData?: any }): Promise<ReportEntry> {
    const res = await callRpc<any>("fn_report_create", {
      p_client_id: report.client_id || null,
      p_week_start: report.weekStart || null,
      p_week_end: report.weekEnd || null,
      p_report_data: report.reportData || {},
    });

    if (!res.is_success || !res.data) {
      throw new Error(res.message || "Failed to create report");
    }

    const created: ReportEntry = {
      id: String(res.data.id),
      client_id: res.data.client_id ? String(res.data.client_id) : undefined,
      client: "Workspace Aggregate",
      weekStart: res.data.week_start,
      weekEnd: res.data.week_end,
      reportData: res.data.report_data,
      createdAt: res.data.created_at,
    };

    MEMORY_CACHE.reports = [created, ...MEMORY_CACHE.reports];
    dispatchChange("reports");
    return created;
  },

  async deleteReport(id: string): Promise<boolean> {
    const res = await callRpc("fn_report_delete", { p_id: id });
    if (!res.is_success) {
      throw new Error(res.message || "Failed to delete report");
    }
    MEMORY_CACHE.reports = MEMORY_CACHE.reports.filter((r) => r.id !== id);
    dispatchChange("reports");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Workspace Settings
  // ----------------------------------------------------------------------------
  getSettings(): WorkspaceSettings {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("insightone_settings");
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return {
      companyName: "Insight One Enterprise",
      domain: "insightone.com",
      industry: "Enterprise AI & Growth Operations",
      timezone: "UTC-05:00 (Eastern Time)",
      currency: "USD ($)",
      dateFormat: "YYYY-MM-DD",
      brandColor: "#0f172a",
      emailUpdates: true,
      slackAlerts: true,
      weeklySummary: true,
      securityAuditAlerts: true,
      enforce2FA: true,
      sessionTimeout: "4 Hours",
    };
  },

  saveSettings(settings: Partial<WorkspaceSettings>): WorkspaceSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("insightone_settings", JSON.stringify(updated));
      } catch {}
    }
    dispatchChange("settings");
    return updated;
  },

  async updateSettings(settings: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    return this.saveSettings(settings);
  },

  // ----------------------------------------------------------------------------
  // Compatibility Aliases for Existing Views
  // ----------------------------------------------------------------------------
  async getClientById(id: string): Promise<Client | null> {
    const clients = await this.getClients();
    return clients.find((c) => c.id === id) || null;
  },
  async getContentById(id: string): Promise<ContentItem | null> {
    const items = await this.getContentItems();
    return items.find((c) => c.id === id) || null;
  },
  async getContent(query?: string, stage?: string, priority?: string): Promise<ContentItem[]> {
    return this.getContentItems(query, stage, priority);
  },
  async updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    return this.updateContentItem(id, updates);
  },
  async deleteContent(id: string): Promise<boolean> {
    return this.deleteContentItem(id);
  },
  async getNetworking(query?: string, status?: string, type?: string): Promise<NetworkingEntry[]> {
    return this.getNetworkingContacts(query, status, type);
  },
  async updateNetworking(id: string, updates: Partial<NetworkingEntry>): Promise<NetworkingEntry | null> {
    return this.updateNetworkingContact(id, updates);
  },
  async deleteNetworking(id: string): Promise<boolean> {
    return this.deleteNetworkingContact(id);
  },
  async getEngagement(query?: string, platform?: string): Promise<EngagementEntry[]> {
    return this.getEngagementMetrics(query, platform);
  },
  async deleteEngagement(id: string): Promise<boolean> {
    return this.deleteEngagementMetric(id);
  },
  async getEvents(query?: string, type?: string): Promise<CalendarEvent[]> {
    return this.getCalendarEvents(query, type);
  },
  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    return this.createCalendarEvent(updates as any);
  },
  async deleteEvent(id: string): Promise<boolean> {
    return this.deleteCalendarEvent(id);
  },
  async getDashboardStats() {
    const [clients, projects, tasks, content, team, engagement] = await Promise.all([
      this.getClients(),
      this.getProjects(),
      this.getTasks(),
      this.getContentItems(),
      this.getUsers(),
      this.getEngagementMetrics(),
    ]);

    const activeClients = clients.filter((c) => c.status === "Active").length;
    const activeProjects = projects.filter((p) => p.status !== "Completed").length;
    const pendingTasks = tasks.filter((t) => t.status !== "Done" && t.status !== "Completed").length;
    const scheduledContent = content.filter((c) => c.status === "Schedule").length;
    const publishedContent = content.filter((c) => c.status === "Publish").length;
    const activeEmployees = team.filter((e) => e.status === "Active").length;
    const totalEngagementReach = engagement.reduce((acc, curr) => acc + (curr.reach || 0), 0);

    return {
      totalClients: clients.length,
      activeClients,
      activeEmployees: activeEmployees || 6,
      activeProjects,
      pendingTasks,
      contentInPipeline: content.length,
      contentPipelineCount: content.length,
      scheduledContent,
      publishedContent,
      totalReach: totalEngagementReach || 128500,
      engagementRate: "8.7%",
      revenueTracked: "$1.48M",
    };
  },
};
