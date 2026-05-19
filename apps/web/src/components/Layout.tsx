import { Link, NavLink, Outlet } from "react-router-dom";

import { Button } from "./Button";
import { useAuthStore } from "../lib/auth";

export const Layout = (): JSX.Element => {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-ink">
            ClipForge
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-dusk">
            <NavLink to="/record" className="transition hover:text-ink">
              Record
            </NavLink>
            <NavLink to="/dashboard" className="transition hover:text-ink">
              Dashboard
            </NavLink>
            <NavLink to="/settings" className="transition hover:text-ink">
              Settings
            </NavLink>
            {session ? (
              <Button onClick={logout} variant="ghost">
                Sign Out
              </Button>
            ) : (
              <Link
                to="/"
                className="rounded-full border border-ink/10 bg-white px-4 py-2 text-ink shadow-sm transition hover:-translate-y-0.5"
              >
                Dev Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
};
