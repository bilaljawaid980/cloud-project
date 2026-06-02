import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/Button";
import { useAuthStore } from "../lib/auth";

const features = [
  {
    title: "Browser-native capture",
    body: "Screen, camera, and microphone — recorded directly in the tab. No installs, no extensions, no setup.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 18v3" />
      </svg>
    )
  },
  {
    title: "Direct-to-cloud uploads",
    body: "Resumable multipart streams straight to S3 — no middleman server, no upload caps, no waiting room.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 21h14" />
      </svg>
    )
  },
  {
    title: "Signed share links",
    body: "Private, unlisted, or public — every clip ships with a tamper-proof URL and instant copy-to-clipboard.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
        <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
      </svg>
    )
  }
];

const trustedBy = ["Figma", "Notion", "Linear", "Vercel", "Stripe"];

export const LandingPage = (): JSX.Element => {
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const session = useAuthStore((state) => state.session);
  const [authMode, setAuthMode] = useState<"register" | "sign-in">("register");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (authMode === "register") {
        await register(email, password, name || undefined);
      } else {
        await login(email, password);
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-24 sm:space-y-28">
      {/* Hero */}
      <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div className="space-y-10 animate-fade-up">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-ink/8 bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-700 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-ember-500 animate-pulse-dot" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-ember-600 shadow-[0_0_8px_rgba(122,16,24,0.8)]" />
            </span>
            <span>Now in open beta</span>
            <span className="text-ink-300">·</span>
            <span className="text-ink-500">v0.1</span>
          </div>

          <div className="space-y-7">
            <h1 className="font-display text-[48px] font-bold leading-[1.0] tracking-[-0.025em] text-ink sm:text-[68px] lg:text-[80px]">
              Record.
              <br />
              Share.
              <br />
              <span className="maroon-text bg-[length:200%_200%] animate-gradient-x">
                Done in seconds.
              </span>
            </h1>
            <p className="max-w-xl text-[17px] leading-relaxed text-ink-500">
              The async video tool for teams that ship. Capture your screen, deliver a signed link,
              and get back to work — no installs, no SaaS lock-in, fully open-source.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/record">
              <Button variant="primary" size="lg" leftIcon={
                <span className="relative flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75 animate-pulse-dot" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
              }>
                Start recording
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="lg" rightIcon={<span className="ml-0.5 transition-transform group-hover:translate-x-0.5">→</span>}>
                Open the library
              </Button>
            </Link>
          </div>

          <dl className="grid max-w-lg grid-cols-3 gap-8 border-t border-ink/8 pt-7">
            {[
              { k: "0", l: "Server hops" },
              { k: "S3", l: "Direct upload" },
              { k: "MIT", l: "License" }
            ].map((stat) => (
              <div key={stat.l}>
                <dt className="font-display text-3xl font-bold tracking-tight text-ink">{stat.k}</dt>
                <dd className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">{stat.l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Login panel */}
        <aside className="surface-elevated edge-light relative overflow-hidden rounded-3xl p-7 sm:p-8 animate-fade-up">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(122,16,24,0.6)_30%,rgba(168,49,58,0.6)_70%,transparent_100%)]" />
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ember-600/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-ember-500/15 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Account access</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ember-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ember-700 ring-1 ring-ember-200">
                <span className="h-1.5 w-1.5 rounded-full bg-ember-600 shadow-[0_0_8px_rgba(122,16,24,0.6)] animate-pulse-dot" />
                Open
              </span>
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
              {authMode === "register" ? "Create your account." : "Sign in to your account."}
            </h2>
            <p className="mt-2 text-[14px] text-ink-500">
              {authMode === "register"
                ? "Create your own workspace with an email and password."
                : "Use the email and password you created earlier."}
            </p>

            {session ? (
              <div className="mt-7 space-y-4">
                <div className="rounded-2xl border border-ink/8 bg-white/70 p-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                    Signed in
                  </p>
                  <p className="mt-1.5 font-display text-lg text-ink">{session.email}</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link to="/dashboard"><Button variant="primary">Open library</Button></Link>
                  <Link to="/record"><Button variant="ghost">Record now</Button></Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(event) => { event.preventDefault(); void handleLogin(); }}
                className="mt-7 space-y-4"
              >
                <div className="grid grid-cols-2 rounded-xl border border-ink/10 bg-white/75 p-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className={`h-9 rounded-lg text-[12.5px] font-semibold transition-colors focus-ring ${
                      authMode === "register" ? "bg-ink text-white" : "text-ink-500 hover:text-ink"
                    }`}
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("sign-in")}
                    className={`h-9 rounded-lg text-[12.5px] font-semibold transition-colors focus-ring ${
                      authMode === "sign-in" ? "bg-ink text-white" : "text-ink-500 hover:text-ink"
                    }`}
                  >
                    Sign in
                  </button>
                </div>
                <Field label="Work email" htmlFor="email">
                  <input
                    id="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    className="h-11 w-full rounded-xl border border-ink/10 bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-300 focus-ring"
                  />
                </Field>
                {authMode === "register" ? (
                  <Field label="Display name" htmlFor="name" optional>
                    <input
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      placeholder="Your name"
                      className="h-11 w-full rounded-xl border border-ink/10 bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-300 focus-ring"
                    />
                  </Field>
                ) : null}
                <Field label="Password" htmlFor="password">
                  <input
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete={authMode === "register" ? "new-password" : "current-password"}
                    placeholder={authMode === "register" ? "At least 8 characters" : "Your password"}
                    required
                    minLength={authMode === "register" ? 8 : 1}
                    className="h-11 w-full rounded-xl border border-ink/10 bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-300 focus-ring"
                  />
                </Field>

                {error ? (
                  <div className="rounded-xl border border-ember-200 bg-ember-50 px-3.5 py-2.5 text-[13px] text-ember-700">
                    {error}
                  </div>
                ) : null}

                <Button
                  disabled={isSubmitting}
                  variant="primary"
                  size="lg"
                  className="w-full"
                  type="submit"
                >
                  {isSubmitting
                    ? authMode === "register" ? "Creating account…" : "Signing in…"
                    : authMode === "register" ? "Create account" : "Sign in"}
                </Button>

                <p className="text-center text-[11px] uppercase tracking-[0.2em] text-ink-400">
                  Password protected · MVP build
                </p>
              </form>
            )}
          </div>
        </aside>
      </section>

      {/* Social proof */}
      <section className="space-y-5">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-ink-400">
          Inspired by the tools teams already love
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-65">
          {trustedBy.map((name) => (
            <span key={name} className="font-display text-lg font-semibold tracking-tight text-ink-700">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="space-y-10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow">Why ClipForge</span>
            <h2 className="mt-3 max-w-2xl font-display text-[36px] font-bold tracking-[-0.02em] text-ink sm:text-[46px]">
              Built for teams that prefer
              <br />
              <span className="maroon-text">ship over schedule.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[14.5px] text-ink-500">
            Three pillars, no fluff. Capture, deliver, and share — each tuned for fast turnaround
            and zero infrastructure overhead.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="surface edge-light group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 ring-1 ring-ember-600/30" />
              <span className="absolute right-5 top-5 font-mono text-[11px] text-ink-300 tabular-nums">
                0{index + 1}
              </span>
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#a8313a_0%,#7a1018_100%)] text-white shadow-[0_10px_24px_-8px_rgba(122,16,24,0.55)] ring-1 ring-white/15">
                <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
                <span className="relative">{feature.icon}</span>
              </div>
              <h3 className="mt-5 font-display text-[19px] font-semibold tracking-tight text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing band */}
      <section className="surface-elevated edge-light relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(122,16,24,0.6),rgba(168,49,58,0.6),transparent)]" />
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-ember-600/22 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-ember-500/18 blur-3xl" />

        <div className="relative flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <span className="eyebrow">Ready when you are</span>
            <h3 className="mt-3 font-display text-[32px] font-bold tracking-tight text-ink sm:text-[40px]">
              Hit record. <span className="maroon-text">The link ships itself.</span>
            </h3>
          </div>
          <Link to="/record">
            <Button variant="primary" size="lg" rightIcon={<span className="transition-transform group-hover:translate-x-0.5">→</span>}>
              Open the recorder
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

interface FieldProps {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}

const Field = ({ label, htmlFor, optional, children }: FieldProps): JSX.Element => (
  <label htmlFor={htmlFor} className="block space-y-1.5">
    <span className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
        {label}
      </span>
      {optional ? (
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-ink-300">Optional</span>
      ) : null}
    </span>
    {children}
  </label>
);
