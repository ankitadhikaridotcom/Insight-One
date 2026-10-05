import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0_40%,_#dfe7ee_100%)] px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white/70 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
            <div>
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold">
                i
              </div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Insight One</p>
              <h2 className="mt-6 text-4xl font-semibold leading-tight">The operating system for client, content, and team performance.</h2>
            </div>

            <div className="grid gap-5 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Overview</div>
                <div className="mt-2 text-2xl font-semibold text-white">128</div>
                <div className="mt-1 text-slate-300">Active clients across the network</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-slate-400">Tasks</div>
                  <div className="mt-2 text-xl font-semibold text-white">23</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-slate-400">Engagement</div>
                  <div className="mt-2 text-xl font-semibold text-white">8.7%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 md:p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
