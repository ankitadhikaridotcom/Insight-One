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
  status: "Planning" | "In Progress" | "On Hold" | "Completed";
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
  client: string; // Display name
  title: string;
  contentType: string; // Maps to content_type
  content_type?: string;
  platform: string;
  description: string;
  assignee: string; // Maps to assigned_employee
  assigned_employee?: string;
  priority: "Low" | "Medium" | "High";
  dueDate: string; // Maps to due_date
  due_date?: string;
  status: ContentStage; // Maps to stage
  stage?: string;
  createdAt?: string;
  created_at?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  client_id?: string;
  client: string; // Display name
  assignee: string; // Maps to assigned_employee
  assigned_employee?: string;
  priority: "Low" | "Medium" | "High";
  status: "To Do" | "In Progress" | "Blocked" | "Completed";
  dueDate: string; // Maps to due_date
  due_date?: string;
  createdAt?: string;
  created_at?: string;
};

export type NetworkingEntry = {
  id: string;
  person: string; // Maps to person_name
  person_name?: string;
  company: string;
  email: string;
  phone: string;
  date: string;
  type: "Coffee" | "Call" | "Conference" | "Partnership" | "Meeting"; // Maps to networking_type
  networking_type?: string;
  status: "Planned" | "Connected" | "Follow-up";
  notes: string;
  followUpDate: string; // Maps to follow_up_date
  follow_up_date?: string;
  createdAt?: string;
  created_at?: string;
};

export type EngagementEntry = {
  id: string;
  client_id?: string;
  client: string; // Display name
  platform: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  metrics: string;
  performance: "Above benchmark" | "Strong" | "Growing" | "Average";
  notes: string;
  createdAt?: string;
  created_at?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  client_id?: string;
  client: string;
  date: string; // Extracted or direct
  startTime: string; // Maps to start_time
  start_time?: string;
  endTime: string; // Maps to end_time
  end_time?: string;
  type: "Meeting" | "Task" | "Content Deadline" | "Launch"; // Maps to event_type
  event_type?: string;
  createdAt?: string;
  created_at?: string;
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
// Memory Cache (Populated strictly from Supabase responses)
// ==============================================================================
const MEMORY_CACHE: {
  profiles: Employee[];
  clients: Client[];
  projects: Project[];
  content: ContentItem[];
  tasks: Task[];
  networking: NetworkingEntry[];
  engagement: EngagementEntry[];
  events: CalendarEvent[];
} = {
  profiles: [],
  clients: [],
  projects: [],
  content: [],
  tasks: [],
  networking: [],
  engagement: [],
  events: [],
};

export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

function dispatchChange(entity: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("insightone_supabase_changed", { detail: { entity } }));
  }
}

// Generate valid UUID fallback
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==============================================================================
// Persistent Supabase Data Service
// ==============================================================================

export const DataService = {
  // ----------------------------------------------------------------------------
  // Profiles (Users / Employees)
  // ----------------------------------------------------------------------------
  getUsers: async (): Promise<Employee[]> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] profiles query:", error.message);
        return [];
      }
      if (data) {
        const mapped = data.map((row: any) => ({
          id: row.id,
          name: row.full_name || row.email,
          full_name: row.full_name,
          email: row.email,
          role: row.role || "Employee",
          department: row.department || "General",
          phone: row.phone || "",
          status: row.status || "Active",
          createdAt: row.created_at,
          created_at: row.created_at,
        }));
        MEMORY_CACHE.profiles = mapped;
        return mapped;
      }
      return [];
    } catch (err: any) {
      console.warn("[Supabase] profiles error:", err.message);
      return [];
    }
  },

  createUser: async (user: Omit<Employee, "id">): Promise<Employee> => {
    const payload: any = {
      full_name: user.name,
      email: user.email.toLowerCase().trim(),
      role: user.role,
      department: user.department,
      phone: user.phone || null,
      status: user.status || "Active",
    };
    if (user.password) {
      payload.password = user.password;
    }

    let data = null;
    let error = null;

    const res = await supabase.from("profiles").insert([payload]).select().single();
    if (res.error && res.error.code === "PGRST204" && payload.password) {
      // Column 'password' not yet added to profiles table in Supabase. Retry without it.
      delete payload.password;
      const retry = await supabase.from("profiles").insert([payload]).select().single();
      data = retry.data;
      error = retry.error;
    } else {
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("[Supabase] Insert profiles error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'profiles' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
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
      id: data.id,
      name: data.full_name,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      department: data.department,
      phone: data.phone || "",
      status: data.status,
      password: user.password,
      createdAt: data.created_at,
    };
    MEMORY_CACHE.profiles = [created, ...MEMORY_CACHE.profiles.filter((p) => p.id !== created.id)];
    dispatchChange("profiles");
    return created;
  },

  updateUser: async (id: string, updates: Partial<Employee>): Promise<Employee | null> => {
    if (!isValidUUID(id)) {
      const idx = MEMORY_CACHE.profiles.findIndex((p) => p.id === id);
      if (idx !== -1) {
        MEMORY_CACHE.profiles[idx] = { ...MEMORY_CACHE.profiles[idx], ...updates };
        dispatchChange("profiles");
        return MEMORY_CACHE.profiles[idx];
      }
      return null;
    }

    const payload: any = {};
    if (updates.name) payload.full_name = updates.name;
    if (updates.email) payload.email = updates.email.toLowerCase().trim();
    if (updates.role) payload.role = updates.role;
    if (updates.department) payload.department = updates.department;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.status) payload.status = updates.status;
    if (updates.password) payload.password = updates.password;

    let data = null;
    let error = null;

    const res = await supabase.from("profiles").update(payload).eq("id", id).select().maybeSingle();
    if (res.error && res.error.code === "PGRST204" && payload.password) {
      delete payload.password;
      const retry = await supabase.from("profiles").update(payload).eq("id", id).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    } else {
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("[Supabase] Update profiles error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'profiles' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    if (updates.password && updates.email) {
      saveUserCredential(
        updates.email,
        updates.password,
        updates.name,
        updates.role?.toLowerCase().includes("admin") ? "admin" : "employee"
      );
    }

    if (data) {
      const updated: Employee = {
        id: data.id,
        name: data.full_name,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        department: data.department,
        phone: data.phone || "",
        status: data.status,
        createdAt: data.created_at,
      };
      const idx = MEMORY_CACHE.profiles.findIndex((p) => p.id === id);
      if (idx !== -1) MEMORY_CACHE.profiles[idx] = updated;
      dispatchChange("profiles");
      return updated;
    }
    return null;
  },

  deleteUser: async (id: string): Promise<boolean> => {
    if (!isValidUUID(id)) {
      MEMORY_CACHE.profiles = MEMORY_CACHE.profiles.filter((p) => p.id !== id);
      dispatchChange("profiles");
      return true;
    }

    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] Delete profiles error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'profiles' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }
    MEMORY_CACHE.profiles = MEMORY_CACHE.profiles.filter((p) => p.id !== id);
    dispatchChange("profiles");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Clients
  // ----------------------------------------------------------------------------
  getClients: async (): Promise<Client[]> => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] clients query:", error.message);
        return [];
      }
      if (data) {
        const mapped: Client[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          company: row.company,
          email: row.email,
          phone: row.phone || "",
          website: row.website || "",
          industry: row.industry || "General",
          status: row.status || "Active",
          notes: row.notes || "",
          value: row.value || "$25k",
          createdAt: row.created_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));
        MEMORY_CACHE.clients = mapped;
        return mapped;
      }
      return [];
    } catch (err: any) {
      console.warn("[Supabase] clients error:", err.message);
      return [];
    }
  },

  getClientById: async (id: string): Promise<Client | null> => {
    if (!id || !isValidUUID(id)) {
      return MEMORY_CACHE.clients.find((c) => c.id === id) || null;
    }
    try {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          company: data.company,
          email: data.email,
          phone: data.phone || "",
          website: data.website || "",
          industry: data.industry || "General",
          status: data.status || "Active",
          notes: data.notes || "",
          value: data.value || "$25k",
          createdAt: data.created_at,
        };
      }
    } catch {}
    return null;
  },

  createClient: async (client: Omit<Client, "id">): Promise<Client> => {
    const payload = {
      name: client.name,
      company: client.company,
      email: client.email.toLowerCase().trim(),
      phone: client.phone || null,
      website: client.website || null,
      industry: client.industry || null,
      status: client.status,
      notes: client.notes || null,
      value: client.value || "$25k",
    };

    const { data, error } = await supabase.from("clients").insert([payload]).select().single();

    if (error) {
      console.error("[Supabase] Insert clients error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'clients' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    const created: Client = {
      id: data.id,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone || "",
      website: data.website || "",
      industry: data.industry || "",
      status: data.status,
      notes: data.notes || "",
      value: data.value || "$25k",
      createdAt: data.created_at,
    };
    MEMORY_CACHE.clients = [created, ...MEMORY_CACHE.clients.filter((c) => c.id !== created.id)];
    dispatchChange("clients");
    return created;
  },

  updateClient: async (id: string, updates: Partial<Client>): Promise<Client | null> => {
    if (!isValidUUID(id)) {
      const idx = MEMORY_CACHE.clients.findIndex((c) => c.id === id);
      if (idx !== -1) {
        MEMORY_CACHE.clients[idx] = { ...MEMORY_CACHE.clients[idx], ...updates };
        dispatchChange("clients");
        return MEMORY_CACHE.clients[idx];
      }
      return null;
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.name) payload.name = updates.name;
    if (updates.company) payload.company = updates.company;
    if (updates.email) payload.email = updates.email.toLowerCase().trim();
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.website !== undefined) payload.website = updates.website;
    if (updates.industry) payload.industry = updates.industry;
    if (updates.status) payload.status = updates.status;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.value !== undefined) payload.value = updates.value;

    const { data, error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Update clients error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'clients' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    if (data) {
      const updated: Client = {
        id: data.id,
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone || "",
        website: data.website || "",
        industry: data.industry || "",
        status: data.status,
        notes: data.notes || "",
        value: data.value || "$25k",
        createdAt: data.created_at,
      };
      const idx = MEMORY_CACHE.clients.findIndex((c) => c.id === id);
      if (idx !== -1) MEMORY_CACHE.clients[idx] = updated;
      dispatchChange("clients");
      return updated;
    }
    return null;
  },

  deleteClient: async (id: string): Promise<boolean> => {
    if (!isValidUUID(id)) {
      MEMORY_CACHE.clients = MEMORY_CACHE.clients.filter((c) => c.id !== id);
      dispatchChange("clients");
      return true;
    }

    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] Delete clients error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'clients' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }
    MEMORY_CACHE.clients = MEMORY_CACHE.clients.filter((c) => c.id !== id);
    dispatchChange("clients");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Projects
  // ----------------------------------------------------------------------------
  getProjects: async (): Promise<Project[]> => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(id, name, company)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] projects query:", error.message);
        return [];
      }
      if (data) {
        const mapped: Project[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          client_id: row.client_id,
          client: row.clients?.company || row.clients?.name || "Client",
          description: row.description || "",
          manager: row.project_manager || "",
          assignedTeam: row.assigned_team || row.project_manager || "",
          startDate: row.start_date || "",
          dueDate: row.due_date || "",
          priority: row.priority || "Medium",
          status: row.status || "Planning",
          createdAt: row.created_at,
        }));
        MEMORY_CACHE.projects = mapped;
        return mapped;
      }
      return [];
    } catch (err: any) {
      console.warn("[Supabase] projects error:", err.message);
      return [];
    }
  },

  createProject: async (project: Omit<Project, "id">): Promise<Project> => {
    const payload = {
      name: project.name,
      client_id: isValidUUID(project.client_id) ? project.client_id : null,
      description: project.description || "",
      project_manager: project.manager || "",
      assigned_team: project.assignedTeam || "",
      start_date: project.startDate || null,
      due_date: project.dueDate || null,
      priority: project.priority || "Medium",
      status: project.status || "Planning",
    };

    const { data, error } = await supabase.from("projects").insert([payload]).select().single();

    if (error) {
      console.error("[Supabase] Insert projects error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'projects' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    const created: Project = {
      id: data.id,
      name: data.name,
      client_id: data.client_id,
      client: project.client || "Client",
      description: data.description || "",
      manager: data.project_manager || "",
      assignedTeam: data.assigned_team || "",
      startDate: data.start_date || "",
      dueDate: data.due_date || "",
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
    };
    MEMORY_CACHE.projects = [created, ...MEMORY_CACHE.projects.filter((p) => p.id !== created.id)];
    dispatchChange("projects");
    return created;
  },

  updateProject: async (id: string, updates: Partial<Project>): Promise<Project | null> => {
    if (!isValidUUID(id)) {
      const idx = MEMORY_CACHE.projects.findIndex((p) => p.id === id);
      if (idx !== -1) {
        MEMORY_CACHE.projects[idx] = { ...MEMORY_CACHE.projects[idx], ...updates };
        dispatchChange("projects");
        return MEMORY_CACHE.projects[idx];
      }
      return null;
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.name) payload.name = updates.name;
    if (updates.client_id !== undefined) payload.client_id = isValidUUID(updates.client_id) ? updates.client_id : null;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.manager) payload.project_manager = updates.manager;
    if (updates.assignedTeam) payload.assigned_team = updates.assignedTeam;
    if (updates.startDate) payload.start_date = updates.startDate;
    if (updates.dueDate) payload.due_date = updates.dueDate;
    if (updates.priority) payload.priority = updates.priority;
    if (updates.status) payload.status = updates.status;

    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Update projects error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'projects' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    if (data) {
      const idx = MEMORY_CACHE.projects.findIndex((p) => p.id === id);
      const existing = idx !== -1 ? MEMORY_CACHE.projects[idx] : null;
      const updated: Project = {
        id: data.id,
        name: data.name,
        client_id: data.client_id,
        client: existing?.client || "Client",
        description: data.description || "",
        manager: data.project_manager,
        assignedTeam: data.assigned_team || "",
        startDate: data.start_date || "",
        dueDate: data.due_date || "",
        priority: data.priority,
        status: data.status,
        createdAt: data.created_at,
      };
      if (idx !== -1) MEMORY_CACHE.projects[idx] = updated;
      dispatchChange("projects");
      return updated;
    }
    return null;
  },

  deleteProject: async (id: string): Promise<boolean> => {
    if (!isValidUUID(id)) {
      MEMORY_CACHE.projects = MEMORY_CACHE.projects.filter((p) => p.id !== id);
      dispatchChange("projects");
      return true;
    }

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] Delete projects error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'projects' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }
    MEMORY_CACHE.projects = MEMORY_CACHE.projects.filter((p) => p.id !== id);
    dispatchChange("projects");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Content Pipeline (8 Stages)
  // ----------------------------------------------------------------------------
  getContent: async (): Promise<ContentItem[]> => {
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*, clients(id, name, company)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] content query:", error.message);
        return [];
      }
      if (data) {
        const mapped: ContentItem[] = data.map((row: any) => ({
          id: row.id,
          client_id: row.client_id,
          client: row.clients?.company || row.clients?.name || "Client",
          title: row.title,
          contentType: row.content_type || "Article",
          platform: row.platform || "LinkedIn",
          description: row.description || "",
          assignee: row.assigned_employee || "",
          priority: row.priority || "Medium",
          dueDate: row.due_date || "",
          status: stageFromDb(row.stage),
          createdAt: row.created_at,
        }));
        MEMORY_CACHE.content = mapped;
        return mapped;
      }
      return [];
    } catch (err: any) {
      console.warn("[Supabase] content error:", err.message);
      return [];
    }
  },

  getContentById: async (id: string): Promise<ContentItem | null> => {
    if (!id || !isValidUUID(id)) {
      return MEMORY_CACHE.content.find((c) => c.id === id) || null;
    }
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*, clients(id, name, company)")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        return null;
      }
      return {
        id: data.id,
        client_id: data.client_id,
        client: data.clients?.company || data.clients?.name || "Client",
        title: data.title,
        contentType: data.content_type || "Article",
        platform: data.platform || "LinkedIn",
        description: data.description || "",
        assignee: data.assigned_employee || "",
        priority: (data.priority as "Low" | "Medium" | "High") || "Medium",
        dueDate: data.due_date || "",
        status: stageFromDb(data.stage),
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  },

  createContent: async (content: Omit<ContentItem, "id">): Promise<ContentItem> => {
    const payload = {
      client_id: isValidUUID(content.client_id) ? content.client_id : null,
      title: content.title,
      content_type: content.contentType,
      platform: content.platform,
      description: content.description,
      assigned_employee: content.assignee,
      priority: content.priority,
      due_date: content.dueDate || null,
      stage: stageToDb(content.status),
    };

    const { data, error } = await supabase.from("content").insert([payload]).select().single();

    if (error) {
      console.error("[Supabase] Insert content error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'content' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    const created: ContentItem = {
      id: data.id,
      client_id: data.client_id,
      client: content.client,
      title: data.title,
      contentType: data.content_type || "",
      platform: data.platform || "",
      description: data.description || "",
      assignee: data.assigned_employee || "",
      priority: data.priority,
      dueDate: data.due_date || "",
      status: stageFromDb(data.stage),
      createdAt: data.created_at,
    };
    MEMORY_CACHE.content = [created, ...MEMORY_CACHE.content.filter((c) => c.id !== created.id)];
    dispatchChange("content");
    return created;
  },

  updateContent: async (id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> => {
    if (!isValidUUID(id)) {
      const idx = MEMORY_CACHE.content.findIndex((c) => c.id === id);
      if (idx !== -1) {
        MEMORY_CACHE.content[idx] = { ...MEMORY_CACHE.content[idx], ...updates };
        dispatchChange("content");
        return MEMORY_CACHE.content[idx];
      }
      return null;
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title) payload.title = updates.title;
    if (updates.client_id !== undefined) payload.client_id = isValidUUID(updates.client_id) ? updates.client_id : null;
    if (updates.contentType) payload.content_type = updates.contentType;
    if (updates.platform) payload.platform = updates.platform;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.assignee) payload.assigned_employee = updates.assignee;
    if (updates.priority) payload.priority = updates.priority;
    if (updates.dueDate) payload.due_date = updates.dueDate;
    if (updates.status) payload.stage = stageToDb(updates.status);

    const { data, error } = await supabase
      .from("content")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Update content error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'content' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    if (data) {
      const idx = MEMORY_CACHE.content.findIndex((c) => c.id === id);
      const existing = idx !== -1 ? MEMORY_CACHE.content[idx] : null;
      const updated: ContentItem = {
        id: data.id,
        client_id: data.client_id,
        client: existing?.client || "Client",
        title: data.title,
        contentType: data.content_type || "",
        platform: data.platform || "",
        description: data.description || "",
        assignee: data.assigned_employee || "",
        priority: data.priority,
        dueDate: data.due_date || "",
        status: stageFromDb(data.stage),
        createdAt: data.created_at,
      };
      if (idx !== -1) MEMORY_CACHE.content[idx] = updated;
      dispatchChange("content");
      return updated;
    }
    return null;
  },

  deleteContent: async (id: string): Promise<boolean> => {
    if (!isValidUUID(id)) {
      MEMORY_CACHE.content = MEMORY_CACHE.content.filter((c) => c.id !== id);
      dispatchChange("content");
      return true;
    }

    const { error } = await supabase.from("content").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] Delete content error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'content' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }
    MEMORY_CACHE.content = MEMORY_CACHE.content.filter((c) => c.id !== id);
    dispatchChange("content");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Tasks
  // ----------------------------------------------------------------------------
  getTasks: async (): Promise<Task[]> => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, clients(id, name, company)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] tasks query:", error.message);
        return [];
      }
      if (data) {
        const mapped: Task[] = data.map((row: any) => ({
          id: row.id,
          client_id: row.client_id,
          client: row.clients?.company || row.clients?.name || "Client",
          title: row.title,
          description: row.description || "",
          assignee: row.assigned_employee || "",
          priority: row.priority || "Medium",
          status: row.status || "To Do",
          dueDate: row.due_date || "",
          createdAt: row.created_at,
        }));
        MEMORY_CACHE.tasks = mapped;
        return mapped;
      }
      return [];
    } catch (err: any) {
      console.warn("[Supabase] tasks error:", err.message);
      return [];
    }
  },

  createTask: async (task: Omit<Task, "id">): Promise<Task> => {
    const payload = {
      title: task.title,
      description: task.description || "",
      client_id: isValidUUID(task.client_id) ? task.client_id : null,
      assigned_employee: task.assignee || "",
      priority: task.priority || "Medium",
      status: task.status || "To Do",
      due_date: task.dueDate || null,
    };

    const { data, error } = await supabase.from("tasks").insert([payload]).select().single();

    if (error) {
      console.error("[Supabase] Insert tasks error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'tasks' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    const created: Task = {
      id: data.id,
      title: data.title,
      description: data.description || "",
      client_id: data.client_id,
      client: task.client || "Client",
      assignee: data.assigned_employee || "",
      priority: data.priority,
      status: data.status,
      dueDate: data.due_date || "",
      createdAt: data.created_at,
    };
    MEMORY_CACHE.tasks = [created, ...MEMORY_CACHE.tasks.filter((t) => t.id !== created.id)];
    dispatchChange("tasks");
    return created;
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    if (!isValidUUID(id)) {
      const idx = MEMORY_CACHE.tasks.findIndex((t) => t.id === id);
      if (idx !== -1) {
        MEMORY_CACHE.tasks[idx] = { ...MEMORY_CACHE.tasks[idx], ...updates };
        dispatchChange("tasks");
        return MEMORY_CACHE.tasks[idx];
      }
      return null;
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.client_id !== undefined) payload.client_id = isValidUUID(updates.client_id) ? updates.client_id : null;
    if (updates.assignee) payload.assigned_employee = updates.assignee;
    if (updates.priority) payload.priority = updates.priority;
    if (updates.status) payload.status = updates.status;
    if (updates.dueDate) payload.due_date = updates.dueDate;

    const { data, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Update tasks error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'tasks' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    if (data) {
      const idx = MEMORY_CACHE.tasks.findIndex((t) => t.id === id);
      const existing = idx !== -1 ? MEMORY_CACHE.tasks[idx] : null;
      const updated: Task = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        client_id: data.client_id,
        client: existing?.client || "Client",
        assignee: data.assigned_employee,
        priority: data.priority,
        status: data.status,
        dueDate: data.due_date || "",
        createdAt: data.created_at,
      };
      if (idx !== -1) MEMORY_CACHE.tasks[idx] = updated;
      dispatchChange("tasks");
      return updated;
    }
    return null;
  },

  deleteTask: async (id: string): Promise<boolean> => {
    if (!isValidUUID(id)) {
      MEMORY_CACHE.tasks = MEMORY_CACHE.tasks.filter((t) => t.id !== id);
      dispatchChange("tasks");
      return true;
    }

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] Delete tasks error:", error);
      if (error.code === "PGRST205") {
        throw new Error("Table 'tasks' does not exist in Supabase yet. Please run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }
    MEMORY_CACHE.tasks = MEMORY_CACHE.tasks.filter((t) => t.id !== id);
    dispatchChange("tasks");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Networking
  // ----------------------------------------------------------------------------
  getNetworking: async (): Promise<NetworkingEntry[]> => {
    try {
      const { data, error } = await supabase
        .from("networking")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] networking query:", error.message);
        return [];
      }
      if (data) {
        const mapped: NetworkingEntry[] = data.map((row: any) => ({
          id: row.id,
          person: row.person_name,
          person_name: row.person_name,
          company: row.company,
          email: row.email || "",
          phone: row.phone || "",
          date: row.date || "",
          type: row.networking_type || "Call",
          networking_type: row.networking_type,
          status: row.status || "Connected",
          notes: row.notes || "",
          followUpDate: row.follow_up_date || "",
          createdAt: row.created_at,
        }));
        MEMORY_CACHE.networking = mapped;
        return mapped;
      }
      return [];
    } catch (err: any) {
      console.warn("[Supabase] networking error:", err.message);
      return [];
    }
  },

  createNetworking: async (entry: Omit<NetworkingEntry, "id">): Promise<NetworkingEntry> => {
    const payload = {
      person_name: entry.person,
      company: entry.company,
      email: entry.email || null,
      phone: entry.phone || null,
      networking_type: entry.type || "Call",
      date: entry.date || new Date().toISOString().split("T")[0],
      status: entry.status || "Connected",
      notes: entry.notes || null,
      follow_up_date: entry.followUpDate || null,
    };

    const { data, error } = await supabase.from("networking").insert([payload]).select().single();

    if (error) {
      console.error("[Supabase] Insert networking error:", error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    const created: NetworkingEntry = {
      id: data.id,
      person: data.person_name,
      company: data.company,
      email: data.email || "",
      phone: data.phone || "",
      date: data.date,
      type: data.networking_type,
      status: data.status,
      notes: data.notes || "",
      followUpDate: data.follow_up_date || "",
      createdAt: data.created_at,
    };
    MEMORY_CACHE.networking = [created, ...MEMORY_CACHE.networking.filter((n) => n.id !== created.id)];
    dispatchChange("networking");
    return created;
  },

  updateNetworking: async (id: string, updates: Partial<NetworkingEntry>): Promise<NetworkingEntry | null> => {
    if (!isValidUUID(id)) {
      const idx = MEMORY_CACHE.networking.findIndex((n) => n.id === id);
      if (idx !== -1) {
        MEMORY_CACHE.networking[idx] = { ...MEMORY_CACHE.networking[idx], ...updates };
        dispatchChange("networking");
        return MEMORY_CACHE.networking[idx];
      }
      return null;
    }

    const payload: any = {};
    if (updates.person) payload.person_name = updates.person;
    if (updates.company) payload.company = updates.company;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.type) payload.networking_type = updates.type;
    if (updates.date) payload.date = updates.date;
    if (updates.status) payload.status = updates.status;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.followUpDate !== undefined) payload.follow_up_date = updates.followUpDate;

    const { data, error } = await supabase
      .from("networking")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Update networking error:", error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    if (data) {
      const updated: NetworkingEntry = {
        id: data.id,
        person: data.person_name,
        company: data.company,
        email: data.email || "",
        phone: data.phone || "",
        date: data.date,
        type: data.networking_type,
        status: data.status,
        notes: data.notes || "",
        followUpDate: data.follow_up_date || "",
        createdAt: data.created_at,
      };
      const idx = MEMORY_CACHE.networking.findIndex((n) => n.id === id);
      if (idx !== -1) MEMORY_CACHE.networking[idx] = updated;
      dispatchChange("networking");
      return updated;
    }
    return null;
  },

  deleteNetworking: async (id: string): Promise<boolean> => {
    if (!isValidUUID(id)) {
      MEMORY_CACHE.networking = MEMORY_CACHE.networking.filter((n) => n.id !== id);
      dispatchChange("networking");
      return true;
    }

    const { error } = await supabase.from("networking").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] Delete networking error:", error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }
    MEMORY_CACHE.networking = MEMORY_CACHE.networking.filter((n) => n.id !== id);
    dispatchChange("networking");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Engagement
  // ----------------------------------------------------------------------------
  getEngagement: async (): Promise<EngagementEntry[]> => {
    try {
      const { data, error } = await supabase
        .from("engagement")
        .select("*, clients(id, name, company)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] engagement query:", error.message);
        return [];
      }
      if (data) {
        const mapped: EngagementEntry[] = data.map((row: any) => ({
          id: row.id,
          client_id: row.client_id,
          client: row.clients?.company || row.clients?.name || "Client",
          platform: row.platform,
          date: row.date,
          likes: row.likes || 0,
          comments: row.comments || 0,
          shares: row.shares || 0,
          reach: row.reach || 0,
          impressions: row.impressions || 0,
          performance: row.performance || "Strong",
          notes: row.notes || "",
          metrics: `${row.reach > 0 ? `${(row.reach / 1000).toFixed(1)}k reach` : `${row.likes || 0} likes`} • ${row.comments || 0} comments`,
          createdAt: row.created_at,
        }));
        MEMORY_CACHE.engagement = mapped;
        return mapped;
      }
      return [];
    } catch (err: any) {
      console.warn("[Supabase] engagement error:", err.message);
      return [];
    }
  },

  createEngagement: async (entry: Omit<EngagementEntry, "id">): Promise<EngagementEntry> => {
    const payload = {
      client_id: isValidUUID(entry.client_id) ? entry.client_id : null,
      platform: entry.platform,
      date: entry.date,
      likes: entry.likes || 0,
      comments: entry.comments || 0,
      shares: entry.shares || 0,
      reach: entry.reach || 0,
      impressions: entry.impressions || 0,
      performance: entry.performance || "Strong",
      notes: entry.notes || "",
    };

    const { data, error } = await supabase.from("engagement").insert([payload]).select().single();

    if (error) {
      console.error("[Supabase] Insert engagement error:", error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    const created: EngagementEntry = {
      id: data.id,
      client_id: data.client_id,
      client: entry.client,
      platform: data.platform,
      date: data.date,
      likes: data.likes,
      comments: data.comments,
      shares: data.shares,
      reach: data.reach,
      impressions: data.impressions,
      performance: data.performance,
      notes: data.notes || "",
      metrics: entry.metrics || `${data.likes} likes`,
      createdAt: data.created_at,
    };
    MEMORY_CACHE.engagement = [created, ...MEMORY_CACHE.engagement.filter((e) => e.id !== created.id)];
    dispatchChange("engagement");
    return created;
  },

  updateEngagement: async (id: string, updates: Partial<EngagementEntry>): Promise<EngagementEntry | null> => {
    if (!isValidUUID(id)) {
      const idx = MEMORY_CACHE.engagement.findIndex((e) => e.id === id);
      if (idx !== -1) {
        MEMORY_CACHE.engagement[idx] = { ...MEMORY_CACHE.engagement[idx], ...updates };
        dispatchChange("engagement");
        return MEMORY_CACHE.engagement[idx];
      }
      return null;
    }

    const payload: any = {};
    if (updates.platform) payload.platform = updates.platform;
    if (updates.date) payload.date = updates.date;
    if (updates.likes !== undefined) payload.likes = updates.likes;
    if (updates.comments !== undefined) payload.comments = updates.comments;
    if (updates.shares !== undefined) payload.shares = updates.shares;
    if (updates.reach !== undefined) payload.reach = updates.reach;
    if (updates.impressions !== undefined) payload.impressions = updates.impressions;
    if (updates.performance) payload.performance = updates.performance;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from("engagement")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Update engagement error:", error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    if (data) {
      const idx = MEMORY_CACHE.engagement.findIndex((e) => e.id === id);
      const existing = idx !== -1 ? MEMORY_CACHE.engagement[idx] : null;
      const updated: EngagementEntry = {
        id: data.id,
        client_id: data.client_id,
        client: existing?.client || "Client",
        platform: data.platform,
        date: data.date,
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        reach: data.reach,
        impressions: data.impressions,
        performance: data.performance,
        notes: data.notes || "",
        metrics: `${data.reach > 0 ? `${(data.reach / 1000).toFixed(1)}k reach` : `${data.likes} likes`} • ${data.comments} comments`,
        createdAt: data.created_at,
      };
      if (idx !== -1) MEMORY_CACHE.engagement[idx] = updated;
      dispatchChange("engagement");
      return updated;
    }
    return null;
  },

  deleteEngagement: async (id: string): Promise<boolean> => {
    if (!isValidUUID(id)) {
      MEMORY_CACHE.engagement = MEMORY_CACHE.engagement.filter((e) => e.id !== id);
      dispatchChange("engagement");
      return true;
    }

    const { error } = await supabase.from("engagement").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] Delete engagement error:", error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }
    MEMORY_CACHE.engagement = MEMORY_CACHE.engagement.filter((e) => e.id !== id);
    dispatchChange("engagement");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Calendar Events
  // ----------------------------------------------------------------------------
  getEvents: async (): Promise<CalendarEvent[]> => {
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*, clients(id, name, company)")
        .order("start_time", { ascending: true });

      if (error) {
        console.warn("[Supabase] calendar_events query:", error.message);
        return [];
      }
      if (data) {
        const mapped: CalendarEvent[] = data.map((row: any) => {
          let dateStr = row.start_time ? row.start_time.split("T")[0] : "";
          let startStr = row.start_time ? row.start_time.split("T")[1]?.slice(0, 5) || "10:00" : "10:00";
          let endStr = row.end_time ? row.end_time.split("T")[1]?.slice(0, 5) || "11:00" : "11:00";

          return {
            id: row.id,
            client_id: row.client_id,
            client: row.clients?.company || row.clients?.name || "",
            title: row.title,
            description: row.description || "",
            type: (row.event_type as any) || "Meeting",
            date: dateStr,
            startTime: startStr,
            endTime: endStr,
            createdAt: row.created_at,
          };
        });
        MEMORY_CACHE.events = mapped;
        return mapped;
      }
      return [];
    } catch (err: any) {
      console.warn("[Supabase] calendar_events error:", err.message);
      return [];
    }
  },

  createEvent: async (event: Omit<CalendarEvent, "id">): Promise<CalendarEvent> => {
    const startIso = event.date ? `${event.date}T${event.startTime || "10:00"}:00Z` : new Date().toISOString();
    const endIso = event.date ? `${event.date}T${event.endTime || "11:00"}:00Z` : new Date().toISOString();

    const payload = {
      title: event.title,
      description: event.description || "",
      client_id: isValidUUID(event.client_id) ? event.client_id : null,
      event_type: event.type,
      start_time: startIso,
      end_time: endIso,
    };

    const { data, error } = await supabase.from("calendar_events").insert([payload]).select().single();

    if (error) {
      console.error("[Supabase] Insert calendar_events error:", error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    const created: CalendarEvent = {
      id: data.id,
      title: data.title,
      description: data.description || "",
      client_id: data.client_id,
      client: event.client,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type,
      createdAt: data.created_at,
    };
    MEMORY_CACHE.events = [created, ...MEMORY_CACHE.events.filter((ev) => ev.id !== created.id)];
    dispatchChange("events");
    return created;
  },

  updateEvent: async (id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    if (!isValidUUID(id)) {
      const idx = MEMORY_CACHE.events.findIndex((e) => e.id === id);
      if (idx !== -1) {
        MEMORY_CACHE.events[idx] = { ...MEMORY_CACHE.events[idx], ...updates };
        dispatchChange("events");
        return MEMORY_CACHE.events[idx];
      }
      return null;
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.type) payload.event_type = updates.type;
    if (updates.date && updates.startTime) {
      payload.start_time = `${updates.date}T${updates.startTime}:00Z`;
    }
    if (updates.date && updates.endTime) {
      payload.end_time = `${updates.date}T${updates.endTime}:00Z`;
    }

    const { data, error } = await supabase
      .from("calendar_events")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Update calendar_events error:", error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    if (data) {
      const idx = MEMORY_CACHE.events.findIndex((e) => e.id === id);
      const existing = idx !== -1 ? MEMORY_CACHE.events[idx] : null;
      const updated: CalendarEvent = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        client_id: data.client_id,
        client: existing?.client || "",
        date: updates.date || existing?.date || "",
        startTime: updates.startTime || existing?.startTime || "10:00",
        endTime: updates.endTime || existing?.endTime || "11:00",
        type: (data.event_type as any) || "Meeting",
        createdAt: data.created_at,
      };
      if (idx !== -1) MEMORY_CACHE.events[idx] = updated;
      dispatchChange("events");
      return updated;
    }
    return null;
  },

  deleteEvent: async (id: string): Promise<boolean> => {
    if (!isValidUUID(id)) {
      MEMORY_CACHE.events = MEMORY_CACHE.events.filter((e) => e.id !== id);
      dispatchChange("events");
      return true;
    }

    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] Delete calendar_events error:", error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }
    MEMORY_CACHE.events = MEMORY_CACHE.events.filter((e) => e.id !== id);
    dispatchChange("events");
    return true;
  },

  // ----------------------------------------------------------------------------
  // Settings
  // ----------------------------------------------------------------------------
  getSettings: (): WorkspaceSettings => {
    const defaultSettings: WorkspaceSettings = {
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
    };
    if (typeof window === "undefined") {
      return defaultSettings;
    }
    try {
      const raw = localStorage.getItem("insightone_settings");
      if (!raw) return defaultSettings;
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {
      return defaultSettings;
    }
  },

  saveSettings: (settings: Partial<WorkspaceSettings>): WorkspaceSettings => {
    const current = DataService.getSettings();
    const updated = { ...current, ...settings };
    if (typeof window !== "undefined") {
      localStorage.setItem("insightone_settings", JSON.stringify(updated));
    }
    return updated;
  },

  resetAllDemoData: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("insightone_settings");
    }
    dispatchChange("reset");
  },

  // ----------------------------------------------------------------------------
  // Live Dashboard Statistics from Supabase
  // ----------------------------------------------------------------------------
  getDashboardStats: async () => {
    try {
      const [clientsRes, profilesRes, tasksRes, contentRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id, status", { count: "exact" }),
        supabase.from("tasks").select("id, status"),
        supabase.from("content").select("id, stage"),
      ]);

      const totalClients = clientsRes.count ?? 0;
      const activeEmployees =
        profilesRes.data && profilesRes.data.length > 0
          ? profilesRes.data.filter((p: any) => p.status === "Active").length
          : 0;

      const tasksList = tasksRes.data && tasksRes.data.length > 0 ? tasksRes.data : [];
      const pendingTasks = tasksList.filter((t: any) => t.status !== "Completed").length;

      const contentList = contentRes.data && contentRes.data.length > 0 ? contentRes.data : [];
      const contentInPipeline = contentList.filter((c: any) => c.stage !== "publish").length;
      const scheduledContent = contentList.filter((c: any) => c.stage === "schedule").length;
      const publishedContent = contentList.filter((c: any) => c.stage === "publish").length;

      return {
        totalClients,
        activeEmployees,
        pendingTasks,
        contentInPipeline,
        scheduledContent,
        publishedContent,
      };
    } catch {
      return {
        totalClients: 0,
        activeEmployees: 0,
        pendingTasks: 0,
        contentInPipeline: 0,
        scheduledContent: 0,
        publishedContent: 0,
      };
    }
  },
};
