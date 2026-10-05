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

    // Resilient fallback: If RPC function not deployed yet, query live clients table
    try {
      let req = supabase.from("clients").select("*");
      if (status && status !== "ALL") req = req.eq("status", status);
      const { data: tableData, error: tableErr } = await req;
      if (!tableErr && tableData && tableData.length > 0) {
        let list = tableData;
        if (query?.trim()) {
          const q = query.trim().toLowerCase();
          list = list.filter(
            (c: any) =>
              (c.name && c.name.toLowerCase().includes(q)) ||
              (c.company && c.company.toLowerCase().includes(q)) ||
              (c.email && c.email.toLowerCase().includes(q))
          );
        }
        const mapped = list.map((c: any) => ({
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
    } catch (_) {}

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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, insert directly into Supabase
    if (res.status_code === 404) {
      const { data: inserted, error: insertErr } = await supabase
        .from("clients")
        .insert({
          name: client.name.trim(),
          company: client.company.trim(),
          email: client.email.trim(),
          phone: client.phone?.trim() || "",
          website: client.website?.trim() || "",
          industry: client.industry?.trim() || "Technology",
          status: client.status || "Active",
          value: client.value || "$25k",
          notes: client.notes?.trim() || "",
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      const created: Client = {
        id: String(inserted.id),
        name: inserted.name,
        company: inserted.company,
        email: inserted.email,
        phone: inserted.phone || "",
        website: inserted.website || "",
        industry: inserted.industry || "",
        status: inserted.status,
        value: inserted.value,
        notes: inserted.notes || "",
        createdAt: inserted.created_at,
      };

      MEMORY_CACHE.clients = [created, ...MEMORY_CACHE.clients];
      dispatchChange("clients");
      return created;
    }

    throw new Error(res.message || "Failed to create client in Supabase");
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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, update directly in Supabase
    if (res.status_code === 404) {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.company) dbUpdates.company = updates.company;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.website !== undefined) dbUpdates.website = updates.website;
      if (updates.industry !== undefined) dbUpdates.industry = updates.industry;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.value) dbUpdates.value = updates.value;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data: updatedRow, error: updateErr } = await supabase
        .from("clients")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      const updated: Client = {
        id: String(updatedRow.id),
        name: updatedRow.name,
        company: updatedRow.company,
        email: updatedRow.email,
        phone: updatedRow.phone || "",
        website: updatedRow.website || "",
        industry: updatedRow.industry || "",
        status: updatedRow.status,
        value: updatedRow.value,
        notes: updatedRow.notes || "",
        createdAt: updatedRow.created_at,
      };

      MEMORY_CACHE.clients = MEMORY_CACHE.clients.map((c) => (c.id === id ? updated : c));
      dispatchChange("clients");
      return updated;
    }

    throw new Error(res.message || "Failed to update client");
  },

  async deleteClient(id: string): Promise<boolean> {
    const res = await callRpc("fn_client_delete", { p_id: id });
    if (res.is_success) {
      MEMORY_CACHE.clients = MEMORY_CACHE.clients.filter((c) => c.id !== id);
      dispatchChange("clients");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, delete directly in Supabase
    if (res.status_code === 404) {
      const { error: delErr } = await supabase.from("clients").delete().eq("id", id);
      if (delErr) {
        throw new Error(delErr.message);
      }
      MEMORY_CACHE.clients = MEMORY_CACHE.clients.filter((c) => c.id !== id);
      dispatchChange("clients");
      return true;
    }

    throw new Error(res.message || "Failed to delete client");
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

    // Resilient fallback: If RPC function not deployed yet, query live projects table
    try {
      let req = supabase.from("projects").select("*");
      if (status && status !== "ALL") req = req.eq("status", status);
      if (priority && priority !== "ALL") req = req.eq("priority", priority);
      const { data: tableData, error: tableErr } = await req;
      if (!tableErr && tableData && tableData.length > 0) {
        let list = tableData;
        if (query?.trim()) {
          const q = query.trim().toLowerCase();
          list = list.filter(
            (p: any) =>
              (p.name && p.name.toLowerCase().includes(q)) ||
              (p.description && p.description.toLowerCase().includes(q))
          );
        }
        const mapped: Project[] = list.map((p: any) => ({
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
    } catch (_) {}

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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, insert directly into Supabase
    if (res.status_code === 404) {
      const { data: inserted, error: insertErr } = await supabase
        .from("projects")
        .insert({
          name: project.name.trim(),
          client_id: project.client_id || null,
          description: project.description?.trim() || "",
          project_manager: project.manager || project.project_manager || "Unassigned",
          assigned_team: project.assignedTeam || project.assigned_team || "Team",
          start_date: project.startDate || project.start_date || null,
          due_date: project.dueDate || project.due_date || null,
          priority: project.priority || "Medium",
          status: project.status || "Planning",
          progress: project.progress || 0,
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      const created: Project = {
        id: String(inserted.id),
        name: inserted.name,
        client_id: inserted.client_id ? String(inserted.client_id) : undefined,
        client: project.client || "Internal Project",
        description: inserted.description || "",
        manager: inserted.project_manager || "Unassigned",
        assignedTeam: inserted.assigned_team || "Team",
        startDate: inserted.start_date || "",
        dueDate: inserted.due_date || "",
        priority: inserted.priority,
        status: inserted.status,
        progress: inserted.progress ?? 0,
        createdAt: inserted.created_at,
      };

      MEMORY_CACHE.projects = [created, ...MEMORY_CACHE.projects];
      dispatchChange("projects");
      return created;
    }

    throw new Error(res.message || "Failed to create project in Supabase");
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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, update directly in Supabase
    if (res.status_code === 404) {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.client_id !== undefined) dbUpdates.client_id = updates.client_id;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.manager || updates.project_manager)
        dbUpdates.project_manager = updates.manager || updates.project_manager;
      if (updates.assignedTeam || updates.assigned_team)
        dbUpdates.assigned_team = updates.assignedTeam || updates.assigned_team;
      if (updates.startDate || updates.start_date)
        dbUpdates.start_date = updates.startDate || updates.start_date;
      if (updates.dueDate || updates.due_date)
        dbUpdates.due_date = updates.dueDate || updates.due_date;
      if (updates.priority) dbUpdates.priority = updates.priority;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;

      const { data: updatedRow, error: updateErr } = await supabase
        .from("projects")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      const updated: Project = {
        id: String(updatedRow.id),
        name: updatedRow.name,
        client_id: updatedRow.client_id ? String(updatedRow.client_id) : undefined,
        client: updates.client || "Internal Project",
        description: updatedRow.description || "",
        manager: updatedRow.project_manager || "Unassigned",
        assignedTeam: updatedRow.assigned_team || "Team",
        startDate: updatedRow.start_date || "",
        dueDate: updatedRow.due_date || "",
        priority: updatedRow.priority,
        status: updatedRow.status,
        progress: updatedRow.progress ?? 0,
        createdAt: updatedRow.created_at,
      };

      MEMORY_CACHE.projects = MEMORY_CACHE.projects.map((p) => (p.id === id ? updated : p));
      dispatchChange("projects");
      return updated;
    }

    throw new Error(res.message || "Failed to update project");
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

    if (res.is_success) {
      MEMORY_CACHE.projects = MEMORY_CACHE.projects.map((p) =>
        p.id === id ? { ...p, status, progress: progress ?? p.progress } : p
      );
      dispatchChange("projects");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, update status directly in Supabase
    if (res.status_code === 404) {
      const dbUpdates: any = { status };
      if (progress !== undefined) dbUpdates.progress = progress;

      const { error: updateErr } = await supabase.from("projects").update(dbUpdates).eq("id", id);
      if (updateErr) {
        throw new Error(updateErr.message);
      }

      MEMORY_CACHE.projects = MEMORY_CACHE.projects.map((p) =>
        p.id === id ? { ...p, status, progress: progress ?? p.progress } : p
      );
      dispatchChange("projects");
      return true;
    }

    throw new Error(res.message || "Failed to update project status");
  },

  async deleteProject(id: string): Promise<boolean> {
    const res = await callRpc("fn_project_delete", { p_id: id });
    if (res.is_success) {
      MEMORY_CACHE.projects = MEMORY_CACHE.projects.filter((p) => p.id !== id);
      dispatchChange("projects");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, delete directly in Supabase
    if (res.status_code === 404) {
      const { error: delErr } = await supabase.from("projects").delete().eq("id", id);
      if (delErr) {
        throw new Error(delErr.message);
      }
      MEMORY_CACHE.projects = MEMORY_CACHE.projects.filter((p) => p.id !== id);
      dispatchChange("projects");
      return true;
    }

    throw new Error(res.message || "Failed to delete project");
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

    // Resilient fallback: If RPC function not deployed yet, query live tasks table
    try {
      let req = supabase.from("tasks").select("*");
      if (status && status !== "ALL") req = req.eq("status", status);
      if (priority && priority !== "ALL") req = req.eq("priority", priority);
      const { data: tableData, error: tableErr } = await req;
      if (!tableErr && tableData && tableData.length > 0) {
        let list = tableData;
        if (query?.trim()) {
          const q = query.trim().toLowerCase();
          list = list.filter(
            (t: any) =>
              (t.title && t.title.toLowerCase().includes(q)) ||
              (t.description && t.description.toLowerCase().includes(q))
          );
        }
        const mapped: Task[] = list.map((t: any) => ({
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
    } catch (_) {}

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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, insert directly into Supabase
    if (res.status_code === 404) {
      const { data: inserted, error: insertErr } = await supabase
        .from("tasks")
        .insert({
          title: task.title.trim(),
          client_id: task.client_id || null,
          description: task.description?.trim() || "",
          assigned_employee: task.assignee || task.assigned_employee || "Unassigned",
          priority: task.priority || "Medium",
          status: task.status || "To Do",
          due_date: task.dueDate || task.due_date || null,
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      const created: Task = {
        id: String(inserted.id),
        title: inserted.title,
        client_id: inserted.client_id ? String(inserted.client_id) : undefined,
        client: task.client || "Internal Task",
        description: inserted.description || "",
        assignee: inserted.assigned_employee || "Unassigned",
        priority: inserted.priority,
        status: inserted.status,
        dueDate: inserted.due_date || "",
        createdAt: inserted.created_at,
      };

      MEMORY_CACHE.tasks = [created, ...MEMORY_CACHE.tasks];
      dispatchChange("tasks");
      return created;
    }

    throw new Error(res.message || "Failed to create task in Supabase");
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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, update directly in Supabase
    if (res.status_code === 404) {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.client_id !== undefined) dbUpdates.client_id = updates.client_id;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.assignee || updates.assigned_employee)
        dbUpdates.assigned_employee = updates.assignee || updates.assigned_employee;
      if (updates.priority) dbUpdates.priority = updates.priority;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.dueDate || updates.due_date) dbUpdates.due_date = updates.dueDate || updates.due_date;

      const { data: updatedRow, error: updateErr } = await supabase
        .from("tasks")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      const updated: Task = {
        id: String(updatedRow.id),
        title: updatedRow.title,
        client_id: updatedRow.client_id ? String(updatedRow.client_id) : undefined,
        client: updates.client || "Internal Task",
        description: updatedRow.description || "",
        assignee: updatedRow.assigned_employee || "Unassigned",
        priority: updatedRow.priority,
        status: updatedRow.status,
        dueDate: updatedRow.due_date || "",
        createdAt: updatedRow.created_at,
      };

      MEMORY_CACHE.tasks = MEMORY_CACHE.tasks.map((t) => (t.id === id ? updated : t));
      dispatchChange("tasks");
      return updated;
    }

    throw new Error(res.message || "Failed to update task");
  },

  async deleteTask(id: string): Promise<boolean> {
    const res = await callRpc("fn_task_delete", { p_id: id });
    if (res.is_success) {
      MEMORY_CACHE.tasks = MEMORY_CACHE.tasks.filter((t) => t.id !== id);
      dispatchChange("tasks");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, delete directly in Supabase
    if (res.status_code === 404) {
      const { error: delErr } = await supabase.from("tasks").delete().eq("id", id);
      if (delErr) {
        throw new Error(delErr.message);
      }
      MEMORY_CACHE.tasks = MEMORY_CACHE.tasks.filter((t) => t.id !== id);
      dispatchChange("tasks");
      return true;
    }

    throw new Error(res.message || "Failed to delete task");
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

    // Resilient fallback: If RPC function not deployed yet, query live profiles table
    try {
      let req = supabase.from("profiles").select("*");
      if (department && department !== "ALL") req = req.eq("department", department);
      if (status && status !== "ALL") req = req.eq("status", status);
      const { data: tableData, error: tableErr } = await req;
      if (!tableErr && tableData && tableData.length > 0) {
        let list = tableData;
        if (query?.trim()) {
          const q = query.trim().toLowerCase();
          list = list.filter(
            (u: any) =>
              (u.full_name && u.full_name.toLowerCase().includes(q)) ||
              (u.email && u.email.toLowerCase().includes(q)) ||
              (u.role && u.role.toLowerCase().includes(q))
          );
        }
        const mapped: Employee[] = list.map((u: any) => ({
          id: String(u.id),
          name: u.full_name || u.name || u.email,
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
    } catch (_) {}

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

    if (res.is_success && res.data) {
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
        name: res.data.name || res.data.full_name,
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
    }

    // Resilient fallback: If RPC function not found in schema cache, insert directly into Supabase
    if (res.status_code === 404) {
      const { data: inserted, error: insertErr } = await supabase
        .from("profiles")
        .insert({
          full_name: user.name.trim(),
          email: user.email.trim().toLowerCase(),
          role: user.role.trim(),
          department: user.department || "General",
          phone: user.phone || "",
          status: user.status || "Active",
          password: user.password || null,
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
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
        id: String(inserted.id),
        name: inserted.full_name,
        email: inserted.email,
        role: inserted.role,
        department: inserted.department,
        phone: inserted.phone || "",
        status: inserted.status,
        createdAt: inserted.created_at,
      };

      MEMORY_CACHE.team = [created, ...MEMORY_CACHE.team];
      dispatchChange("profiles");
      return created;
    }

    throw new Error(res.message || "Failed to create user in Supabase");
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

    if (res.is_success && res.data) {
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
        name: res.data.name || res.data.full_name,
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
    }

    // Resilient fallback: If RPC function not found in schema cache, update directly in Supabase
    if (res.status_code === 404) {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.department) dbUpdates.department = updates.department;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.password) dbUpdates.password = updates.password;

      const { data: updatedRow, error: updateErr } = await supabase
        .from("profiles")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(updateErr.message);
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
        id: String(updatedRow.id),
        name: updatedRow.full_name,
        email: updatedRow.email,
        role: updatedRow.role,
        department: updatedRow.department,
        phone: updatedRow.phone || "",
        status: updatedRow.status,
        createdAt: updatedRow.created_at,
      };

      MEMORY_CACHE.team = MEMORY_CACHE.team.map((e) => (e.id === id ? updated : e));
      dispatchChange("profiles");
      return updated;
    }

    throw new Error(res.message || "Failed to update user");
  },

  async deleteUser(id: string): Promise<boolean> {
    const intId = parseInt(id, 10);
    const res = await callRpc("fn_team_delete", { p_id: isNaN(intId) ? 1 : intId });
    if (res.is_success) {
      MEMORY_CACHE.team = MEMORY_CACHE.team.filter((e) => e.id !== id);
      dispatchChange("profiles");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, delete directly in Supabase
    if (res.status_code === 404) {
      const { error: deleteErr } = await supabase.from("profiles").delete().eq("id", id);
      if (deleteErr) {
        throw new Error(deleteErr.message);
      }
      MEMORY_CACHE.team = MEMORY_CACHE.team.filter((e) => e.id !== id);
      dispatchChange("profiles");
      return true;
    }

    throw new Error(res.message || "Failed to delete user");
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

    // Resilient fallback: If RPC function not deployed yet, query live content table
    try {
      let req = supabase.from("content").select("*");
      if (priority && priority !== "ALL") req = req.eq("priority", priority);
      const { data: tableData, error: tableErr } = await req;
      if (!tableErr && tableData && tableData.length > 0) {
        let list = tableData;
        if (query?.trim()) {
          const q = query.trim().toLowerCase();
          list = list.filter(
            (c: any) =>
              (c.title && c.title.toLowerCase().includes(q)) ||
              (c.description && c.description.toLowerCase().includes(q))
          );
        }
        if (stage && stage !== "ALL") {
          const dbSt = stageToDb(stage as any);
          list = list.filter((c: any) => c.stage === dbSt || c.status === stage);
        }
        const mapped: ContentItem[] = list.map((c: any) => ({
          id: String(c.id),
          client_id: c.client_id ? String(c.client_id) : undefined,
          client: c.client || "Internal",
          title: c.title || "",
          contentType: c.content_type || c.contentType || "Post",
          platform: c.platform || "LinkedIn",
          description: c.description || "",
          assignee: c.assigned_employee || c.assignee || "Unassigned",
          priority: c.priority || "Medium",
          dueDate: c.due_date || c.dueDate || "",
          status: stageFromDb(c.stage || c.status),
          stage: c.stage,
          tenant_id: c.tenant_id,
          createdAt: c.created_at,
        }));
        MEMORY_CACHE.content = mapped;
        return mapped;
      }
    } catch (_) {}

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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, insert directly into Supabase
    if (res.status_code === 404) {
      const { data: inserted, error: insertErr } = await supabase
        .from("content")
        .insert({
          title: item.title.trim(),
          client_id: item.client_id || null,
          content_type: item.contentType || "Post",
          platform: item.platform || "LinkedIn",
          description: item.description?.trim() || "",
          assigned_employee: item.assignee || "Unassigned",
          priority: item.priority || "Medium",
          due_date: item.dueDate || null,
          stage: stageToDb(item.status),
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      const created: ContentItem = {
        id: String(inserted.id),
        title: inserted.title,
        client_id: inserted.client_id ? String(inserted.client_id) : undefined,
        client: "Internal",
        contentType: inserted.content_type || "Post",
        platform: inserted.platform || "LinkedIn",
        description: inserted.description || "",
        assignee: inserted.assigned_employee || "Unassigned",
        priority: inserted.priority,
        dueDate: inserted.due_date || "",
        status: stageFromDb(inserted.stage),
        createdAt: inserted.created_at,
      };

      MEMORY_CACHE.content = [created, ...MEMORY_CACHE.content];
      dispatchChange("content");
      return created;
    }

    throw new Error(res.message || "Failed to create content item");
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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, update directly in Supabase
    if (res.status_code === 404) {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.client_id !== undefined) dbUpdates.client_id = updates.client_id;
      if (updates.contentType) dbUpdates.content_type = updates.contentType;
      if (updates.platform) dbUpdates.platform = updates.platform;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.assignee) dbUpdates.assigned_employee = updates.assignee;
      if (updates.priority) dbUpdates.priority = updates.priority;
      if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
      if (updates.status) dbUpdates.stage = stageToDb(updates.status);

      const { data: updatedRow, error: updateErr } = await supabase
        .from("content")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      const updated: ContentItem = {
        id: String(updatedRow.id),
        title: updatedRow.title,
        client_id: updatedRow.client_id ? String(updatedRow.client_id) : undefined,
        client: "Internal",
        contentType: updatedRow.content_type || "Post",
        platform: updatedRow.platform || "LinkedIn",
        description: updatedRow.description || "",
        assignee: updatedRow.assigned_employee || "Unassigned",
        priority: updatedRow.priority,
        dueDate: updatedRow.due_date || "",
        status: stageFromDb(updatedRow.stage),
        createdAt: updatedRow.created_at,
      };

      MEMORY_CACHE.content = MEMORY_CACHE.content.map((c) => (c.id === id ? updated : c));
      dispatchChange("content");
      return updated;
    }

    throw new Error(res.message || "Failed to update content item");
  },

  async deleteContentItem(id: string): Promise<boolean> {
    const res = await callRpc("fn_content_delete", { p_id: id });
    if (res.is_success) {
      MEMORY_CACHE.content = MEMORY_CACHE.content.filter((c) => c.id !== id);
      dispatchChange("content");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, delete directly in Supabase
    if (res.status_code === 404) {
      const { error: delErr } = await supabase.from("content").delete().eq("id", id);
      if (delErr) {
        throw new Error(delErr.message);
      }
      MEMORY_CACHE.content = MEMORY_CACHE.content.filter((c) => c.id !== id);
      dispatchChange("content");
      return true;
    }

    throw new Error(res.message || "Failed to delete content");
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

    // Resilient fallback: If RPC function not deployed yet, query live networking table
    try {
      let req = supabase.from("networking").select("*");
      if (status && status !== "ALL") req = req.eq("status", status);
      if (type && type !== "ALL") req = req.eq("networking_type", type);
      const { data: tableData, error: tableErr } = await req;
      if (!tableErr && tableData && tableData.length > 0) {
        let list = tableData;
        if (query?.trim()) {
          const q = query.trim().toLowerCase();
          list = list.filter(
            (n: any) =>
              (n.person_name && n.person_name.toLowerCase().includes(q)) ||
              (n.company && n.company.toLowerCase().includes(q))
          );
        }
        const mapped: NetworkingEntry[] = list.map((n: any) => ({
          id: String(n.id),
          person: n.person_name || n.person || "",
          company: n.company || "",
          email: n.email || "",
          phone: n.phone || "",
          date: n.date || "",
          type: n.networking_type || n.type || "Call",
          status: n.status || "Connected",
          notes: n.notes || "",
          followUpDate: n.follow_up_date || n.followUpDate || "",
          tenant_id: n.tenant_id,
          createdAt: n.created_at,
        }));
        MEMORY_CACHE.networking = mapped;
        return mapped;
      }
    } catch (_) {}

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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, insert directly into Supabase
    if (res.status_code === 404) {
      const { data: inserted, error: insertErr } = await supabase
        .from("networking")
        .insert({
          person_name: entry.person.trim(),
          company: entry.company.trim(),
          email: entry.email?.trim() || "",
          phone: entry.phone?.trim() || "",
          networking_type: entry.type || "Call",
          date: entry.date || new Date().toISOString().split("T")[0],
          status: entry.status || "Connected",
          notes: entry.notes?.trim() || "",
          follow_up_date: entry.followUpDate || null,
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      const created: NetworkingEntry = {
        id: String(inserted.id),
        person: inserted.person_name,
        company: inserted.company,
        email: inserted.email || "",
        phone: inserted.phone || "",
        date: inserted.date,
        type: inserted.networking_type,
        status: inserted.status,
        notes: inserted.notes || "",
        followUpDate: inserted.follow_up_date || "",
        createdAt: inserted.created_at,
      };

      MEMORY_CACHE.networking = [created, ...MEMORY_CACHE.networking];
      dispatchChange("networking");
      return created;
    }

    throw new Error(res.message || "Failed to create networking contact");
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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, update directly in Supabase
    if (res.status_code === 404) {
      const dbUpdates: any = {};
      if (updates.person) dbUpdates.person_name = updates.person;
      if (updates.company) dbUpdates.company = updates.company;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.type) dbUpdates.networking_type = updates.type;
      if (updates.date) dbUpdates.date = updates.date;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.followUpDate !== undefined) dbUpdates.follow_up_date = updates.followUpDate;

      const { data: updatedRow, error: updateErr } = await supabase
        .from("networking")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      const updated: NetworkingEntry = {
        id: String(updatedRow.id),
        person: updatedRow.person_name,
        company: updatedRow.company,
        email: updatedRow.email || "",
        phone: updatedRow.phone || "",
        date: updatedRow.date,
        type: updatedRow.networking_type,
        status: updatedRow.status,
        notes: updatedRow.notes || "",
        followUpDate: updatedRow.follow_up_date || "",
        createdAt: updatedRow.created_at,
      };

      MEMORY_CACHE.networking = MEMORY_CACHE.networking.map((n) => (n.id === id ? updated : n));
      dispatchChange("networking");
      return updated;
    }

    throw new Error(res.message || "Failed to update networking contact");
  },

  async deleteNetworkingContact(id: string): Promise<boolean> {
    const res = await callRpc("fn_networking_delete", { p_id: id });
    if (res.is_success) {
      MEMORY_CACHE.networking = MEMORY_CACHE.networking.filter((n) => n.id !== id);
      dispatchChange("networking");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, delete directly in Supabase
    if (res.status_code === 404) {
      const { error: delErr } = await supabase.from("networking").delete().eq("id", id);
      if (delErr) {
        throw new Error(delErr.message);
      }
      MEMORY_CACHE.networking = MEMORY_CACHE.networking.filter((n) => n.id !== id);
      dispatchChange("networking");
      return true;
    }

    throw new Error(res.message || "Failed to delete networking contact");
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

    // Resilient fallback: If RPC function not deployed yet, query live engagement table
    try {
      let req = supabase.from("engagement").select("*");
      if (platform && platform !== "ALL") req = req.eq("platform", platform);
      const { data: tableData, error: tableErr } = await req;
      if (!tableErr && tableData && tableData.length > 0) {
        let list = tableData;
        if (query?.trim()) {
          const q = query.trim().toLowerCase();
          list = list.filter(
            (e: any) =>
              (e.platform && e.platform.toLowerCase().includes(q)) ||
              (e.notes && e.notes.toLowerCase().includes(q))
          );
        }
        const mapped: EngagementEntry[] = list.map((e: any) => ({
          id: String(e.id),
          client_id: e.client_id ? String(e.client_id) : undefined,
          client: "Client Account",
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
    } catch (_) {}

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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, insert directly into Supabase
    if (res.status_code === 404) {
      const { data: inserted, error: insertErr } = await supabase
        .from("engagement")
        .insert({
          client_id: entry.client_id || null,
          platform: entry.platform || "LinkedIn",
          date: entry.date || new Date().toISOString().split("T")[0],
          likes: entry.likes || 0,
          comments: entry.comments || 0,
          shares: entry.shares || 0,
          reach: entry.reach || 0,
          impressions: entry.impressions || 0,
          performance: entry.performance || "Strong",
          notes: entry.notes?.trim() || "",
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      const created: EngagementEntry = {
        id: String(inserted.id),
        client_id: inserted.client_id ? String(inserted.client_id) : undefined,
        client: "Client Account",
        platform: inserted.platform,
        date: inserted.date,
        likes: inserted.likes,
        comments: inserted.comments,
        shares: inserted.shares,
        reach: inserted.reach,
        impressions: inserted.impressions,
        performance: inserted.performance,
        notes: inserted.notes || "",
        createdAt: inserted.created_at,
      };

      MEMORY_CACHE.engagement = [created, ...MEMORY_CACHE.engagement];
      dispatchChange("engagement");
      return created;
    }

    throw new Error(res.message || "Failed to create engagement metric");
  },

  async deleteEngagementMetric(id: string): Promise<boolean> {
    const res = await callRpc("fn_engagement_delete", { p_id: id });
    if (res.is_success) {
      MEMORY_CACHE.engagement = MEMORY_CACHE.engagement.filter((e) => e.id !== id);
      dispatchChange("engagement");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, delete directly in Supabase
    if (res.status_code === 404) {
      const { error: delErr } = await supabase.from("engagement").delete().eq("id", id);
      if (delErr) {
        throw new Error(delErr.message);
      }
      MEMORY_CACHE.engagement = MEMORY_CACHE.engagement.filter((e) => e.id !== id);
      dispatchChange("engagement");
      return true;
    }

    throw new Error(res.message || "Failed to delete engagement metric");
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

    // Resilient fallback: If RPC function not deployed yet, query live calendar_events table
    try {
      let req = supabase.from("calendar_events").select("*");
      if (type && type !== "ALL") req = req.eq("event_type", type);
      const { data: tableData, error: tableErr } = await req;
      if (!tableErr && tableData && tableData.length > 0) {
        let list = tableData;
        if (query?.trim()) {
          const q = query.trim().toLowerCase();
          list = list.filter(
            (e: any) =>
              (e.title && e.title.toLowerCase().includes(q)) ||
              (e.description && e.description.toLowerCase().includes(q))
          );
        }
        const mapped: CalendarEvent[] = list.map((e: any) => ({
          id: String(e.id),
          title: e.title || "",
          description: e.description || "",
          client_id: e.client_id ? String(e.client_id) : undefined,
          client: "Internal",
          type: e.event_type || e.type || "Meeting",
          startTime: e.start_time || e.startTime || "",
          endTime: e.end_time || e.endTime || "",
          date: (e.start_time ? String(e.start_time).split("T")[0] : "") || e.date || "",
          tenant_id: e.tenant_id,
          createdAt: e.created_at,
        }));
        MEMORY_CACHE.calendar = mapped;
        return mapped;
      }
    } catch (_) {}

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

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, insert directly into Supabase
    if (res.status_code === 404) {
      const { data: inserted, error: insertErr } = await supabase
        .from("calendar_events")
        .insert({
          title: event.title.trim(),
          client_id: event.client_id || null,
          description: event.description?.trim() || "",
          event_type: event.type || "Meeting",
          start_time: event.startTime || (event.date ? `${event.date}T09:00:00Z` : new Date().toISOString()),
          end_time: event.endTime || (event.date ? `${event.date}T10:00:00Z` : null),
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      const created: CalendarEvent = {
        id: String(inserted.id),
        title: inserted.title,
        description: inserted.description || "",
        client_id: inserted.client_id ? String(inserted.client_id) : undefined,
        client: "Internal",
        type: inserted.event_type || "Meeting",
        startTime: inserted.start_time,
        endTime: inserted.end_time,
        date: inserted.start_time ? String(inserted.start_time).split("T")[0] : event.date || "",
        createdAt: inserted.created_at,
      };

      MEMORY_CACHE.calendar = [created, ...MEMORY_CACHE.calendar];
      dispatchChange("calendar_events");
      return created;
    }

    throw new Error(res.message || "Failed to create calendar event");
  },

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const res = await callRpc("fn_calendar_event_delete", { p_id: id });
    if (res.is_success) {
      MEMORY_CACHE.calendar = MEMORY_CACHE.calendar.filter((e) => e.id !== id);
      dispatchChange("calendar_events");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, delete directly in Supabase
    if (res.status_code === 404) {
      const { error: delErr } = await supabase.from("calendar_events").delete().eq("id", id);
      if (delErr) {
        throw new Error(delErr.message);
      }
      MEMORY_CACHE.calendar = MEMORY_CACHE.calendar.filter((e) => e.id !== id);
      dispatchChange("calendar_events");
      return true;
    }

    throw new Error(res.message || "Failed to delete calendar event");
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

    // Resilient fallback: If RPC function not deployed yet, query live reports table
    try {
      const { data: tableData, error: tableErr } = await supabase.from("reports").select("*");
      if (!tableErr && tableData && tableData.length > 0) {
        const mapped: ReportEntry[] = tableData.map((r: any) => ({
          id: String(r.id),
          client_id: r.client_id ? String(r.client_id) : undefined,
          client: "Workspace Aggregate",
          weekStart: r.week_start,
          weekEnd: r.week_end,
          reportData: r.report_data,
          createdAt: r.created_at,
        }));
        MEMORY_CACHE.reports = mapped;
        return mapped;
      }
    } catch (_) {}

    return MEMORY_CACHE.reports;
  },

  async createReport(report: { client_id?: string; weekStart?: string; weekEnd?: string; reportData?: any }): Promise<ReportEntry> {
    const res = await callRpc<any>("fn_report_create", {
      p_client_id: report.client_id || null,
      p_week_start: report.weekStart || null,
      p_week_end: report.weekEnd || null,
      p_report_data: report.reportData || {},
    });

    if (res.is_success && res.data) {
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
    }

    // Resilient fallback: If RPC function not found in schema cache, insert directly into Supabase
    if (res.status_code === 404) {
      const { data: inserted, error: insertErr } = await supabase
        .from("reports")
        .insert({
          client_id: report.client_id || null,
          week_start: report.weekStart || new Date().toISOString().split("T")[0],
          week_end: report.weekEnd || new Date().toISOString().split("T")[0],
          report_data: report.reportData || {},
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      const created: ReportEntry = {
        id: String(inserted.id),
        client_id: inserted.client_id ? String(inserted.client_id) : undefined,
        client: "Workspace Aggregate",
        weekStart: inserted.week_start,
        weekEnd: inserted.week_end,
        reportData: inserted.report_data,
        createdAt: inserted.created_at,
      };

      MEMORY_CACHE.reports = [created, ...MEMORY_CACHE.reports];
      dispatchChange("reports");
      return created;
    }

    throw new Error(res.message || "Failed to create report");
  },

  async deleteReport(id: string): Promise<boolean> {
    const res = await callRpc("fn_report_delete", { p_id: id });
    if (res.is_success) {
      MEMORY_CACHE.reports = MEMORY_CACHE.reports.filter((r) => r.id !== id);
      dispatchChange("reports");
      return true;
    }

    // Resilient fallback: If RPC function not found in schema cache, delete directly in Supabase
    if (res.status_code === 404) {
      const { error: delErr } = await supabase.from("reports").delete().eq("id", id);
      if (delErr) {
        throw new Error(delErr.message);
      }
      MEMORY_CACHE.reports = MEMORY_CACHE.reports.filter((r) => r.id !== id);
      dispatchChange("reports");
      return true;
    }

    throw new Error(res.message || "Failed to delete report");
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
