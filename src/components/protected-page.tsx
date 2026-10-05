"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessRoute, getSupabaseUser } from "@/services/authService";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const validateSession = async () => {
      const user = await getSupabaseUser();

      if (!isMounted) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!canAccessRoute(user.role, pathname)) {
        router.replace("/dashboard");
        return;
      }

      setReady(true);
    };

    validateSession();
    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-700">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          Loading workspace...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
