import { useState } from "react";

import { env } from "../lib/env";
import { useAuthStore } from "../lib/auth";

export const SettingsPage = (): JSX.Element => {
  const session = useAuthStore((state) => state.session);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [tokenVisible, setTokenVisible] = useState(false);

  const initial = (session?.name ?? session?.email ?? "?").slice(0, 1).toUpperCase();

  const copyToken = async (): Promise<void> => {
    if (!session?.token) return;
    await navigator.clipboard.writeText(session.token);
    setTokenCopied(true);
    window.setTimeout(() => setTokenCopied(false), 1800);
  };

  return (
    <div className="space-y-9">
      <header className="space-y-4 animate-fade-up">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-ink/8 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-700 backdrop-blur">
          <span className="flex h-1.5 w-1.5 rounded-full bg-ember-600 shadow-[0_0_8px_rgba(122,16,24,0.7)]" />
          Settings
        </div>
        <h1 className="font-display text-[44px] font-bold leading-[1.02] tracking-[-0.025em] text-ink sm:text-[56px]">
          Your <span className="maroon-text">workspace.</span>
        </h1>
        <p className="max-w-2xl text-[15px] text-ink-500">
          Identity, storage, and billing for your ClipForge workspace. More controls land as we
          ship the post-MVP roadmap.
        </p>
      </header>

      <section className="surface-elevated edge-light relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(122,16,24,0.6),rgba(168,49,58,0.6),transparent)]" />
        <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-ember-600/18 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="eyebrow">Identity</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                Your profile
              </h2>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-5 border-b border-ink/[0.08] pb-6">
            <div className="relative">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#a8313a_0%,#7a1018_60%,#440a10_100%)] text-2xl font-display font-bold text-white shadow-[0_10px_28px_-6px_rgba(122,16,24,0.6)] ring-1 ring-white/20">
                <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.35),transparent_55%)]" />
                <span className="relative">{initial}</span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ember-600 ring-2 ring-white shadow-[0_0_10px_rgba(122,16,24,0.65)]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold text-ink">{session?.name ?? "Unnamed"}</p>
              <p className="text-[13.5px] text-ink-500">{session?.email ?? "Unknown email"}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="User ID" mono value={session?.userId ?? "Unknown"} />
            <Field label="Email" value={session?.email ?? "Unknown"} />
            <Field label="Display name" value={session?.name ?? "Not set"} />
            <Field label="Mode" value={env.devMode ? "Development" : "Production"} />
          </dl>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <PlaceholderCard
          eyebrow="Storage"
          title="Bucket usage"
          body="Quota tracking and per-bucket summaries land here post-MVP. We'll show object counts, hot vs. cold storage, and projected monthly cost."
          comingSoon
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
            </svg>
          }
        />
        <PlaceholderCard
          eyebrow="Billing"
          title="Plans & overages"
          body="Usage-based pricing, workspace cost ceilings, and overage alerts are placeholders for now. Open-source teams stay on the free plan."
          comingSoon
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M2 10h20" />
            </svg>
          }
        />
      </section>

      {env.devMode && session ? (
        <section className="surface edge-light relative rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="eyebrow">Dev token</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                API access
              </h2>
              <p className="mt-1 max-w-md text-[13.5px] text-ink-500">
                Use this token to authenticate from external tools while in dev mode. Treat it like
                a password.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTokenVisible((v) => !v)}
                className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-700 hover:border-ember-700/30 hover:text-ember-700 focus-ring"
              >
                {tokenVisible ? "Hide" : "Reveal"}
              </button>
              <button
                onClick={() => void copyToken()}
                className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-700 hover:border-ember-700/30 hover:text-ember-700 focus-ring"
              >
                {tokenCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <pre className="mt-5 max-h-40 overflow-auto rounded-2xl border border-ember-700/20 bg-ink-900 p-4 font-mono text-[11.5px] leading-relaxed text-ember-200 shadow-[inset_0_0_30px_rgba(122,16,24,0.18)]">
            {tokenVisible ? session.token : session.token.replace(/./g, "•")}
          </pre>
        </section>
      ) : null}
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  mono?: boolean;
}

const Field = ({ label, value, mono }: FieldProps): JSX.Element => (
  <div className="flex flex-col gap-1">
    <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">{label}</dt>
    <dd
      className={`truncate text-[14px] text-ink-700 ${mono ? "font-mono text-[12.5px]" : "font-medium"}`}
    >
      {value}
    </dd>
  </div>
);

interface PlaceholderCardProps {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const PlaceholderCard = ({ eyebrow, title, body, icon, comingSoon }: PlaceholderCardProps): JSX.Element => (
  <div className="surface edge-light relative overflow-hidden rounded-3xl p-6">
    <div className="flex items-center justify-between">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#a8313a,#7a1018)] text-white ring-1 ring-white/15 shadow-[0_8px_24px_-8px_rgba(122,16,24,0.55)]">
        <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
        <span className="relative">{icon}</span>
      </div>
      {comingSoon ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-700 ring-1 ring-ink/15">
          <span className="h-1.5 w-1.5 rounded-full bg-ember-600" />
          Soon
        </span>
      ) : null}
    </div>
    <p className="mt-5 eyebrow">{eyebrow}</p>
    <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">{title}</h3>
    <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">{body}</p>
  </div>
);
