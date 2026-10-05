"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/authService";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);

      if (!user) {
        setError("Invalid credentials. Please verify your email and password.");
        return;
      }

      // Successful authentication routes to the workspace dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Unable to complete authentication request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl font-semibold text-white shadow-md">
          i
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Insight One</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Sign In</h1>
        <p className="mt-2 text-sm text-slate-500">Access your organization workspace and portfolios.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Work Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
            placeholder="e.g. alex@insightone.ai"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
              placeholder="Enter your account password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword((val) => !val)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-600">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
        >
          {loading ? "Authenticating..." : "Sign In to Workspace"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-center text-xs text-slate-500">
        Enterprise authentication via Supabase Auth & PostgreSQL RBAC.
      </div>
    </div>
  );
}
