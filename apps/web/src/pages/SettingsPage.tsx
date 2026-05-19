import { env } from "../lib/env";
import { useAuthStore } from "../lib/auth";

export const SettingsPage = (): JSX.Element => {
  const session = useAuthStore((state) => state.session);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-dusk">Settings</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Workspace profile</h1>
      </div>

      <section className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-soft">
        <h2 className="font-display text-3xl text-ink">Identity</h2>
        <div className="mt-5 space-y-3 text-sm text-dusk">
          <p>User ID: <span className="font-semibold text-ink">{session?.userId ?? "Unknown"}</span></p>
          <p>Email: <span className="font-semibold text-ink">{session?.email ?? "Unknown"}</span></p>
          <p>Name: <span className="font-semibold text-ink">{session?.name ?? "Not set"}</span></p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-soft">
          <h2 className="font-display text-3xl text-ink">Storage</h2>
          <p className="mt-4 text-dusk">Quota tracking and bucket summaries land here post-MVP.</p>
        </div>
        <div className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-soft">
          <h2 className="font-display text-3xl text-ink">Billing</h2>
          <p className="mt-4 text-dusk">Usage billing, workspace cost controls, and overage alerts are placeholders for now.</p>
        </div>
      </section>

      {env.devMode && session ? (
        <section className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-soft">
          <h2 className="font-display text-3xl text-ink">Dev Token</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink p-4 text-xs text-white">
            {session.token}
          </pre>
        </section>
      ) : null}
    </div>
  );
};
