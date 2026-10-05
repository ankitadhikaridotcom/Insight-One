import { supabase } from "@/lib/supabaseClient";

export type UserRole = "admin" | "employee";

export interface DemoUser {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
}

export const AUTH_STORAGE_KEY = "insight-demo-auth";

const DEFAULT_DEMO_CREDENTIALS: Record<string, { email: string; password: string; name: string; role: UserRole }> = {
  "admin@insightone.com": {
    email: "admin@insightone.com",
    password: "Admin@123",
    name: "Admin User",
    role: "admin",
  },
  "employee@insightone.com": {
    email: "employee@insightone.com",
    password: "Employee@123",
    name: "Employee User",
    role: "employee",
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

  // 1. Check local credential vault for admin-assigned password
  const vault = getAssignedUserCredentials();
  const assigned = vault[normalizedEmail];

  // 2. Query Supabase profiles table for live account status and credentials
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profile) {
      const dbPassword = (profile as any).password;
      const role: UserRole = profile.role?.toLowerCase().includes("admin") ? "admin" : "employee";
      const name = profile.full_name || normalizedEmail.split("@")[0];

      // Password matches if it matches DB column, assigned vault, or default credentials
      const matchesPassword =
        (dbPassword && dbPassword === normalizedPassword) ||
        (assigned && assigned.password === normalizedPassword) ||
        (DEFAULT_DEMO_CREDENTIALS[normalizedEmail]?.password === normalizedPassword);

      if (matchesPassword) {
        const user: DemoUser = {
          id: profile.id,
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

  // 3. If user matches assigned vault credentials
  if (assigned && assigned.password === normalizedPassword) {
    const user: DemoUser = {
      email: assigned.email,
      name: assigned.name || normalizedEmail.split("@")[0],
      role: assigned.role || (normalizedEmail.includes("admin") ? "admin" : "employee"),
    };
    saveAuthUser(user);
    return user;
  }

  // 4. Attempt Supabase Auth signInWithPassword
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (!signInError && signInData.user) {
      const user: DemoUser = {
        id: signInData.user.id,
        email: normalizedEmail,
        name: signInData.user.user_metadata?.full_name || normalizedEmail.split("@")[0],
        role: signInData.user.user_metadata?.role?.toLowerCase().includes("admin") ? "admin" : "employee",
      };
      saveAuthUser(user);
      return user;
    }
  } catch {}

  // 5. Check default system credentials
  if (DEFAULT_DEMO_CREDENTIALS[normalizedEmail] && DEFAULT_DEMO_CREDENTIALS[normalizedEmail].password === normalizedPassword) {
    const demo = DEFAULT_DEMO_CREDENTIALS[normalizedEmail];
    const user: DemoUser = {
      email: demo.email,
      name: demo.name,
      role: demo.role,
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
      role: parsed.role === "admin" ? "admin" : "employee",
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
      let role: UserRole = cached?.role || (email.includes("admin") ? "admin" : "employee");

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          name = profile.full_name || name;
          if (profile.role) {
            role = profile.role.toLowerCase().includes("admin") ? "admin" : "employee";
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
    { href: "/settings", label: "Settings", icon: "⚙" },
  ];

  const employeeItems = [
    { href: "/dashboard", label: "Dashboard", icon: "▣" },
    { href: "/clients", label: "Clients", icon: "◎" },
    { href: "/projects", label: "Projects", icon: "📁" },
    { href: "/content", label: "Content", icon: "✦" },
    { href: "/tasks", label: "Tasks", icon: "✓" },
    { href: "/calendar", label: "Calendar", icon: "◫" },
    { href: "/engagement", label: "Engagement", icon: "◔" },
  ];

  return role === "admin" ? adminItems : employeeItems;
}

export function canAccessRoute(role: UserRole, pathname: string) {
  const allowedPaths = getRoleBasedNavigation(role).map((item) => item.href);
  const normalized = pathname === "/" ? "/dashboard" : pathname;
  return allowedPaths.some((path) => normalized === path || normalized.startsWith(`${path}/`)) || normalized === "/login";
}
