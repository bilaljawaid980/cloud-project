import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../lib/auth";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  const location = useLocation();
  const { isHydrated, session } = useAuthStore();

  if (!isHydrated) {
    return <div className="py-20 text-center text-dusk">Loading your session...</div>;
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
};
