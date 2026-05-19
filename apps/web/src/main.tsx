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
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative inline-flex h-12 w-12 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-ink/10" />
              <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-ember-600 animate-spin" />
              <span className="relative h-2 w-2 rounded-full bg-ember-600 shadow-[0_0_12px_rgba(122,16,24,0.7)]" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500">
              Loading ClipForge
            </span>
          </div>
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  </React.StrictMode>
);
