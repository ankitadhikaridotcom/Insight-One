import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-lg shadow-blue-500/25">
              i
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-[0.28em] text-blue-400">Insight</div>
              <div className="text-xl font-bold tracking-tight text-white">One</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pipeline" className="hover:text-white transition">Kanban Pipeline</a>
            <a href="#multitenancy" className="hover:text-white transition">Multi-Tenancy</a>
            <a href="#security" className="hover:text-white transition">Enterprise RBAC</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              Launch Workspace →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 lg:pt-32 lg:pb-36">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.22),rgba(255,255,255,0))]" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-8 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Next-Generation Multi-Tenant Growth Operating System</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-tight">
            The command center for <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">high-performance</span> client agencies.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
            Consolidate your client portfolios, deliverables, content pipelines, team ownership, and performance metrics into a single multi-tenant workspace powered by PostgreSQL and Supabase.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-600/25 hover:bg-blue-500 transition"
            >
              <span>Get Started Now</span>
              <span>→</span>
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-base font-medium text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              Explore Platform Architecture
            </a>
          </div>

          {/* Interactive Metric Cards Preview */}
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto text-left">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md">
              <div className="text-xs uppercase font-semibold tracking-wider text-slate-400">Tracked Revenue</div>
              <div className="mt-2 text-3xl font-bold text-white">$1.48M</div>
              <div className="mt-1 text-xs text-emerald-400">↑ +24.6% vs last quarter</div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md">
              <div className="text-xs uppercase font-semibold tracking-wider text-slate-400">Active Retainers</div>
              <div className="mt-2 text-3xl font-bold text-white">128 Brands</div>
              <div className="mt-1 text-xs text-blue-400">Strict tenant isolation</div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md">
              <div className="text-xs uppercase font-semibold tracking-wider text-slate-400">On-Time Pipeline</div>
              <div className="mt-2 text-3xl font-bold text-white">99.2%</div>
              <div className="mt-1 text-xs text-emerald-400">Active Kanban boards</div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md">
              <div className="text-xs uppercase font-semibold tracking-wider text-slate-400">Security Definer</div>
              <div className="mt-2 text-3xl font-bold text-white">100% RPC</div>
              <div className="mt-1 text-xs text-indigo-400">Zero inline client SQL</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section id="features" className="border-t border-slate-800/80 bg-slate-900/30 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">Architecture & Capabilities</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Built for institutional scale and agency rigor
            </p>
            <p className="mt-4 text-slate-400 text-base">
              Every business record follows strict tenant hierarchy, granular scope validation, and database-level security definer functions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl text-blue-400 mb-6">
                🏢
              </div>
              <h3 className="text-xl font-bold text-white">Strict Multi-Tenancy</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Hierarchical model: <span className="text-slate-200">Tenant → Agencies → Clients → Social Profiles</span>. Data isolation is mathematically enforced at the PostgreSQL database level.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl text-indigo-400 mb-6">
                📁
              </div>
              <h3 className="text-xl font-bold text-white">Kanban Project Pipelines</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Interactive Kanban boards for projects and content assets. Track deliverables from Planning to Completed with automatic progress tracking.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl text-purple-400 mb-6">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-white">Enterprise RBAC & Scopes</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Database-driven navigation and scope checks. Database function validation ensures unauthorized users cannot call RPC endpoints or view unauthorized menus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Module Overview Section */}
      <section id="pipeline" className="py-24 border-t border-slate-800/80">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">Integrated Operations</span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-white">
                Everything your agency needs in one cohesive system.
              </h2>
              <p className="mt-4 text-slate-400 leading-relaxed text-sm">
                No more disjointed spreadsheets or disconnected tools. Insight One connects client relationship management, content drafting, task delegation, and executive analytics into a synchronized workflow.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { title: "Client & Portfolio CRM", desc: "Track account value, key contacts, contract terms, and client health." },
                  { title: "Kanban Milestone Delivery", desc: "Organize roadmaps into Planning, In Progress, Review, and Completed stages." },
                  { title: "8-Stage Content Production", desc: "Idea, Topic Approval, Writing, Review, Design, Client Approval, Schedule, Publish." },
                  { title: "Centralized Credential Control", desc: "Admin password management and instant role-based access delegation." },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
                >
                  <span>Access Platform</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-xs font-mono text-slate-400">Insight One Workspace v2.0</div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300">Project Kanban Pipeline</span>
                    <span className="text-emerald-400">Live Synchronized</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="font-semibold text-white">Q3 Multi-Channel Launch</div>
                      <div className="text-slate-400 text-[10px] mt-1">Northstar Labs • In Progress</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="font-semibold text-white">Enterprise Rebranding</div>
                      <div className="text-slate-400 text-[10px] mt-1">Aster Growth • Review</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300">Security & Scope Verification</span>
                    <span className="text-blue-400 font-mono">fn_get_request_context</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <span className="text-purple-400">SELECT</span> public.fn_response_success(<br />
                    &nbsp;&nbsp;p_data := v_data,<br />
                    &nbsp;&nbsp;p_message := <span className="text-emerald-300">'Tenant isolated query complete'</span><br />
                    );
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="border-t border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 py-20 text-center">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to elevate your agency operations?
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Sign in with your enterprise credentials to access your dedicated workspace and managed accounts.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              Sign In to Insight One →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500 text-center">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Insight One Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <span>SOC2 Type II Ready</span>
            <span>PostgreSQL RLS Protected</span>
            <span>Multi-Tenant Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
