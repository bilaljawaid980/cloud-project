import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import { hydrateAuthSession } from "./lib/auth";
import { router } from "./routes";

hydrateAuthSession();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-sand text-sm text-dusk">
          Loading ClipForge...
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  </React.StrictMode>
);
