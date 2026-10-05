"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/authService";

type Role = "admin" | "employee";

const demoCredentials = [
  { label: "Admin", email: "admin@insightone.com", password: "Admin@123", role: "admin" },
  { label: "Employee", email: "employee@insightone.com", password: "Employee@123", role: "employee" },
] as const;

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("admin@insightone.com");
  const [password, setPassword] = useState("Admin@123");
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
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);

      if (!user) {
        setError("Invalid email or password.");
        return;
      }

      const selectedRole = user.role === "admin" ? "admin" : "employee";
      if (role !== selectedRole) {
        setRole(selectedRole);
      }

      router.push("/dashboard");
    } catch {
      setError("Unable to authenticate this demo session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl font-semibold text-white">
          i
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Insight One</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to access your workspace.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {(["admin", "employee"] as Role[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setRole(option);
              const demo = demoCredentials.find((item) => item.role === option);
              if (demo) {
                setEmail(demo.email);
                setPassword(demo.password);
              }
            }}
            className={[
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              role === option
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            ].join(" ")}
          >
            {option === "admin" ? "Admin" : "Employee"} login
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            placeholder="name@company.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              placeholder="Enter your password"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-500"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : `Continue as ${role === "admin" ? "Admin" : "Employee"}`}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Demo access is enabled for local testing only.
      </div>
    </div>
  );
}
