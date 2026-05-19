import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";

const RecorderPage = lazy(async () => import("./pages/RecorderPage").then((module) => ({ default: module.RecorderPage })));
const DashboardPage = lazy(async () =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const PlaybackPage = lazy(async () =>
  import("./pages/PlaybackPage").then((module) => ({ default: module.PlaybackPage }))
);
const SettingsPage = lazy(async () =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: "record",
        element: <RecorderPage />
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: "v/:shareSlug",
        element: <PlaybackPage />
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        )
      }
    ]
  }
]);
