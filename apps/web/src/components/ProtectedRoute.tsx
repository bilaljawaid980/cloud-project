import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../lib/auth";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  const location = useLocation();
  const { isHydrated, session } = useAuthStore();

  if (!isHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative inline-flex h-9 w-9 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-ink/10" />
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-ember-600 animate-spin" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500">
            Restoring your session
          </span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
};
