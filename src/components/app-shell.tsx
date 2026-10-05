"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { getCurrentUser, logout, DemoUser, getRoleBasedNavigation } from "@/services/authService";
import { DataService, NavigationMenuItem } from "@/services/dataService";
import { Modal } from "./modal";

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [dbMenuItems, setDbMenuItems] = useState<NavigationMenuItem[]>([]);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Load user session
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    // Fetch database-driven navigation menu
    DataService.getNavigationMenu()
      .then((items) => {
        if (items && items.length > 0) {
          setDbMenuItems(items);
        }
      })
      .catch(() => {});
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [profileMenuOpen]);

  // Main navigation items: Filter out Settings and Logout from main sidebar list
  const navigationItems = useMemo(() => {
    if (dbMenuItems.length > 0) {
      return dbMenuItems.filter(
        (item) =>
          !item.label.toLowerCase().includes("setting") &&
          !item.label.toLowerCase().includes("logout") &&
          item.href !== "/settings" &&
          item.href !== "/login"
      );
    }

    const fallback = getRoleBasedNavigation(currentUser?.role ?? "admin");
    return fallback.filter(
      (item) =>
        item.label !== "Settings" &&
        item.label !== "Logout" &&
        item.href !== "/settings" &&
        item.href !== "/login"
    );
  }, [dbMenuItems, currentUser?.role]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
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
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-200 bg-white shadow-sm transition-transform duration-200 flex flex-col justify-between ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top: Logo & Branding */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white shadow-sm">
                i
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-[0.24em] text-slate-400">Insight</div>
                <div className="text-lg font-bold text-slate-900 tracking-tight">One</div>
              </div>
            </Link>
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 lg:hidden hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Middle: Main Application Modules Only */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace Modules
          </div>

          {navigationItems.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                <span className="w-5 text-center text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom-Left: Logged-in User Profile Section with Context Menu */}
        <div className="relative border-t border-slate-200 p-3 bg-slate-50/70" ref={profileMenuRef}>
          {/* Profile Popup Context Menu */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser?.name ?? "Admin User"}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {currentUser?.email ?? "admin@insightone.com"}
                </div>
                <div className="mt-1.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize">
                  {currentUser?.role ?? "Admin"} Account
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  <span className="text-sm">👤</span>
                  <span>View Profile</span>
                </button>

                <Link
                  href="/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  <span className="text-sm">⚙</span>
                  <span>Workspace Settings</span>
                </Link>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <span className="text-sm">↩</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Click Target in Bottom-Left of Sidebar */}
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 text-left hover:border-slate-300 hover:shadow-sm transition"
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-xs text-white shadow-sm">
                {getInitials(currentUser?.name)}
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.name ?? "Admin User"}
                </div>
                <div className="text-[11px] text-slate-500 capitalize truncate">
                  {currentUser?.role ?? "Admin"} • Active
                </div>
              </div>
            </div>
            <span className="text-xs text-slate-400 shrink-0">▲</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* PART 3: Fixed / Sticky Page Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
            {/* Left: Title & Navigation */}
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
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Workspace
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  {title}
                </h1>
              </div>
            </div>

            {/* Right: Primary Page Actions Fixed in Top-Right Corner */}
            <div className="flex items-center gap-3">
              {actions}
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {subtitle ? (
            <div className="mb-6">
              <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
            </div>
          ) : null}
          {children}
        </main>
      </div>

      {/* User Profile Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Your Profile"
        subtitle="Current user profile and organization details"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white shadow-md">
              {getInitials(currentUser?.name)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{currentUser?.name}</h3>
              <p className="text-xs text-slate-500">{currentUser?.email}</p>
              <div className="mt-1 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize">
                {currentUser?.role} Account
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-semibold uppercase">Organization:</span>
              <span className="font-semibold text-slate-800">Insight One Enterprise</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-semibold uppercase">Tenant ID:</span>
              <span className="font-semibold text-slate-800">1 (Primary Tenant)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-semibold uppercase">Security Mode:</span>
              <span className="font-semibold text-emerald-600">PostgreSQL Security Definer</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setProfileModalOpen(false)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
