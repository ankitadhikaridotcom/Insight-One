"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { getCurrentUser, getRoleBasedNavigation, logout, DemoUser } from "@/services/authService";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [userDropdownOpen]);

  const navigationItems = useMemo(
    () => [
      ...getRoleBasedNavigation(currentUser?.role ?? "admin"),
      { href: "/login", label: "Logout", icon: "↩" },
    ],
    [currentUser?.role],
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "IO";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/35 transition lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200 bg-white px-5 py-6 shadow-sm transition-transform duration-200 lg:flex lg:flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-2 lg:justify-start">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white shadow-sm">
              i
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Insight</div>
              <div className="text-lg font-semibold text-slate-900">One</div>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <div className="mt-8 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
          {navigationItems.map((item) => {
            const active =
              item.href === "/login"
                ? pathname === "/login"
                : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            if (item.label === "Logout") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <span className="w-5 text-center text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                <span className="w-5 text-center text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="mt-auto pt-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs font-semibold text-slate-700">Insight One System</div>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Role: <span className="font-medium text-slate-700 capitalize">{currentUser?.role ?? "Admin"}</span> • Active
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden hover:bg-slate-50"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                ☰
              </button>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</div>
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {actions}

              {/* User profile dropdown button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-slate-400"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-xs font-semibold text-white shadow-sm">
                    {getInitials(currentUser?.name)}
                  </div>
                  <div className="hidden text-left sm:block pr-1">
                    <div className="text-xs font-semibold text-slate-800 leading-tight">
                      {currentUser?.name ?? "Admin User"}
                    </div>
                    <div className="text-[10px] uppercase font-medium text-slate-400">
                      {currentUser?.role ?? "Admin"}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100 z-50">
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <div className="text-xs font-semibold text-slate-900">
                        {currentUser?.name ?? "Admin User"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {currentUser?.email ?? "admin@insightone.com"}
                      </div>
                      <div className="mt-1.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 capitalize">
                        {currentUser?.role ?? "Admin"} account
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <span>⚙</span>
                        <span>Workspace Settings</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <span>↩</span>
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {subtitle ? (
            <div className="mb-6 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
