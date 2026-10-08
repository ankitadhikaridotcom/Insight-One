import { supabase } from "@/lib/supabaseClient";

export type UserRole =
  | "Role Host"
  | "Tenant Admin"
  | "content creator"
  | "content approver"
  | "Viewer"
  | "admin"
  | "employee";

export interface DemoUser {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
}

export function normalizeRole(r?: string): UserRole {
  if (!r) return "content creator";
  const lower = r.toLowerCase().trim();
  if (lower === "role host" || lower === "host") return "Role Host";
  if (lower === "tenant admin" || lower === "admin") return "Tenant Admin";
  if (lower === "content approver" || lower === "approver") return "content approver";
  if (lower === "viewer") return "Viewer";
  if (lower === "employee") return "content creator";
  return "content creator";
}

export const AUTH_STORAGE_KEY = "insight-demo-auth";

const DEFAULT_DEMO_CREDENTIALS: Record<string, { email: string; password: string; name: string; role: UserRole }> = {
  "admin@insightone.com": {
    email: "admin@insightone.com",
    password: "Admin@123",
    name: "Admin User",
    role: "Tenant Admin",
  },
  "creator@insightone.com": {
    email: "creator@insightone.com",
    password: "Creator@123",
    name: "Content Producer",
    role: "content creator",
  },
  "approver@insightone.com": {
    email: "approver@insightone.com",
    password: "Approver@123",
    name: "Content Approver",
    role: "content approver",
  },
  "viewer@insightone.com": {
    email: "viewer@insightone.com",
    password: "Viewer@123",
    name: "Client Observer",
    role: "Viewer",
  },
  "employee@insightone.com": {
    email: "employee@insightone.com",
    password: "Employee@123",
    name: "Employee User",
    role: "content creator",
  },
};

export const USER_CREDENTIALS_KEY = "insightone_assigned_passwords";

export function getAssignedUserCredentials(): Record<string, { email: string; password: string; name?: string; role?: UserRole }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USER_CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserCredential(email: string, password: string, name?: string, role?: UserRole) {
  if (typeof window === "undefined") return;
  try {
    const current = getAssignedUserCredentials();
    const normalizedEmail = email.trim().toLowerCase();
    current[normalizedEmail] = {
      email: normalizedEmail,
      password: password.trim(),
      name,
      role,
    };
    localStorage.setItem(USER_CREDENTIALS_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}

export async function login(email: string, password: string): Promise<DemoUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  // 1. Attempt Supabase Auth signInWithPassword
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (!signInError && signInData.user) {
      // Fetch role and profile from database via RPC
      let role: UserRole = "content creator";
      let name = signInData.user.user_metadata?.full_name || normalizedEmail.split("@")[0];

      try {
        const { data: profile } = await supabase.rpc("fn_user_me");
        if (profile?.data) {
          role = normalizeRole(profile.data.role);
          name = profile.data.full_name || name;
        }
      } catch {}

      const user: DemoUser = {
        id: signInData.user.id,
        email: normalizedEmail,
        name,
        role,
      };
      saveAuthUser(user);
      return user;
    }
  } catch {}

  // 2. Query Supabase profiles table for live account status and credentials
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profile) {
      const dbPassword = (profile as any).password;
      const role: UserRole = normalizeRole(profile.role);
      const name = profile.full_name || normalizedEmail.split("@")[0];

      const vault = getAssignedUserCredentials();
      const assigned = vault[normalizedEmail];

      const matchesPassword =
        (dbPassword && dbPassword === normalizedPassword) ||
        (assigned && assigned.password === normalizedPassword) ||
        (DEFAULT_DEMO_CREDENTIALS[normalizedEmail]?.password === normalizedPassword);

      if (matchesPassword) {
        const user: DemoUser = {
          id: String(profile.id),
          email: normalizedEmail,
          name,
          role,
        };
        saveAuthUser(user);
        return user;
      }
    }
  } catch (err) {
    console.warn("[Auth] profile lookup check:", err);
  }

  // 3. Check local credential vault for assigned team password
  const vault = getAssignedUserCredentials();
  const assigned = vault[normalizedEmail];
  if (assigned && assigned.password === normalizedPassword) {
    const user: DemoUser = {
      email: assigned.email,
      name: assigned.name || normalizedEmail.split("@")[0],
      role: normalizeRole(assigned.role),
    };
    saveAuthUser(user);
    return user;
  }

  // 4. Default System Credentials Check
  if (DEFAULT_DEMO_CREDENTIALS[normalizedEmail] && DEFAULT_DEMO_CREDENTIALS[normalizedEmail].password === normalizedPassword) {
    const demo = DEFAULT_DEMO_CREDENTIALS[normalizedEmail];
    const user: DemoUser = {
      email: demo.email,
      name: demo.name,
      role: normalizeRole(demo.role),
    };
    saveAuthUser(user);
    return user;
  }

  return null;
}

function saveAuthUser(user: DemoUser) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

export function getCurrentUser(): DemoUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = sessionStorage.getItem(AUTH_STORAGE_KEY) ?? localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    const parsed = JSON.parse(rawSession) as Partial<DemoUser>;
    if (!parsed.email || !parsed.role || !parsed.name) {
      return null;
    }

    return {
      id: parsed.id,
      email: String(parsed.email),
      name: String(parsed.name),
      role: normalizeRole(parsed.role),
    };
  } catch {
    return null;
  }
}

export async function getSupabaseUser(): Promise<DemoUser | null> {
  const cached = getCurrentUser();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const email = session.user.email || cached?.email || "";
      let name = cached?.name || email.split("@")[0];
      let role: UserRole = cached?.role || (email.includes("admin") ? "Tenant Admin" : "content creator");

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          name = profile.full_name || name;
          if (profile.role) {
            role = normalizeRole(profile.role);
          }
        }
      } catch {
        // ignore profile fetch error
      }

      const user: DemoUser = {
        id: session.user.id,
        email,
        name,
        role,
      };
      saveAuthUser(user);
      return user;
    }
  } catch (err) {
    console.warn("[Auth] getSupabaseUser error:", err);
  }
  return cached;
}

export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("[Auth] Sign out error:", err);
  }

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function getRoleBasedNavigation(role: UserRole) {
  const adminItems = [
    { href: "/dashboard", label: "Dashboard", icon: "▣" },
    { href: "/team", label: "Team", icon: "👥" },
    { href: "/clients", label: "Clients", icon: "◎" },
    { href: "/projects", label: "Projects", icon: "📁" },
    { href: "/content", label: "Content", icon: "✦" },
    { href: "/tasks", label: "Tasks", icon: "✓" },
    { href: "/networking", label: "Networking", icon: "◌" },
    { href: "/engagement", label: "Engagement", icon: "◔" },
    { href: "/calendar", label: "Calendar", icon: "◫" },
    { href: "/statistics", label: "Statistics", icon: "▤" },
    { href: "/reports", label: "Reports", icon: "▥" },
  ];

  const approverItems = [
    { href: "/dashboard", label: "Dashboard", icon: "▣" },
    { href: "/clients", label: "Clients", icon: "◎" },
    { href: "/projects", label: "Projects", icon: "📁" },
    { href: "/content", label: "Content", icon: "✦" },
    { href: "/tasks", label: "Tasks", icon: "✓" },
    { href: "/calendar", label: "Calendar", icon: "◫" },
    { href: "/engagement", label: "Engagement", icon: "◔" },
    { href: "/networking", label: "Networking", icon: "◌" },
    { href: "/reports", label: "Reports", icon: "▥" },
  ];

  const creatorItems = [
    { href: "/dashboard", label: "Dashboard", icon: "▣" },
    { href: "/projects", label: "Projects", icon: "📁" },
    { href: "/content", label: "Content", icon: "✦" },
    { href: "/tasks", label: "Tasks", icon: "✓" },
    { href: "/calendar", label: "Calendar", icon: "◫" },
    { href: "/engagement", label: "Engagement", icon: "◔" },
  ];

  const viewerItems = [
    { href: "/dashboard", label: "Dashboard", icon: "▣" },
    { href: "/projects", label: "Projects", icon: "📁" },
    { href: "/calendar", label: "Calendar", icon: "◫" },
    { href: "/statistics", label: "Statistics", icon: "▤" },
  ];

  const normalized = normalizeRole(role);
  if (normalized === "Role Host" || normalized === "Tenant Admin" || normalized === "admin") {
    return adminItems;
  }
  if (normalized === "content approver") {
    return approverItems;
  }
  if (normalized === "Viewer") {
    return viewerItems;
  }
  return creatorItems;
}

export function canAccessRoute(role: UserRole, pathname: string) {
  const allowedPaths = getRoleBasedNavigation(role).map((item) => item.href);
  const normalized = pathname === "/" ? "/dashboard" : pathname;
  return allowedPaths.some((path) => normalized === path || normalized.startsWith(`${path}/`)) || normalized === "/login" || normalized === "/settings";
}
