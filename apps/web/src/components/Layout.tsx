import { Link, NavLink, Outlet } from "react-router-dom";

import { useAuthStore } from "../lib/auth";

const navLinks: Array<{ to: string; label: string }> = [
  { to: "/record", label: "Record" },
  { to: "/dashboard", label: "Library" },
  { to: "/settings", label: "Settings" }
];

export const Layout = (): JSX.Element => {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink/[0.06] bg-[rgba(251,249,248,0.78)] backdrop-blur-2xl backdrop-saturate-150">
        {/* Maroon hairline at very top */}
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(122,16,24,0.5)_30%,rgba(168,49,58,0.5)_70%,transparent_100%)]" />

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
          <Link to="/" className="group inline-flex items-center gap-2.5 focus-ring rounded-xl px-1">
            <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#a8313a_0%,#7a1018_60%,#440a10_100%)] shadow-[0_8px_20px_-6px_rgba(122,16,24,0.55)] ring-1 ring-white/15">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.35),transparent_55%)]" />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="relative">
                <path d="M5 4.5v15l14-7.5L5 4.5z" fill="white" />
              </svg>
            </span>
            <span className="font-display text-[19px] font-bold tracking-tight text-ink">
              ClipForge
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors focus-ring ${
                    isActive ? "text-ink" : "text-ink-500 hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{link.label}</span>
                    {isActive ? (
                      <span className="absolute inset-x-3 -bottom-[15px] h-0.5 rounded-full bg-[linear-gradient(90deg,#a8313a,#7a1018)] shadow-[0_0_10px_rgba(122,16,24,0.6)]" />
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {session ? (
              <>
                <div className="hidden items-center gap-2.5 rounded-full border border-ink/8 bg-white/70 py-1 pl-1.5 pr-3 backdrop-blur md:inline-flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#a8313a,#7a1018)] text-[10px] font-bold uppercase text-white">
                    {(session.name ?? session.email).slice(0, 1)}
                  </span>
                  <span className="max-w-[140px] truncate text-[12.5px] font-medium text-ink-700">
                    {session.name ?? session.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex h-9 items-center rounded-xl border border-ink/10 bg-white/70 px-3.5 text-[13px] font-semibold text-ink-700 transition-all hover:border-ember-700/30 hover:bg-white hover:text-ember-700 focus-ring"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="inline-flex h-9 items-center rounded-xl border border-ink/10 bg-white/80 px-3.5 text-[13px] font-semibold text-ink shadow-[0_1px_2px_rgba(26,13,13,0.04)] transition-all hover:-translate-y-[1px] hover:bg-white hover:border-ember-700/30 focus-ring"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-12">
        <Outlet />
      </main>

      <footer className="border-t border-ink/[0.06] bg-[rgba(251,249,248,0.65)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-6 text-[12.5px] text-ink-500 sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-ember-600 shadow-[0_0_8px_rgba(122,16,24,0.7)] animate-pulse-dot" />
            <span>ClipForge — the open-source Loom alternative</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400">v0.1 · mvp</span>
            <a href="#" className="hover:text-ember-700 transition-colors">Docs</a>
            <a href="#" className="hover:text-ember-700 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
