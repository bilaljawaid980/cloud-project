import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/Button";
import { useAuthStore } from "../lib/auth";

export const LandingPage = (): JSX.Element => {
  const login = useAuthStore((state) => state.login);
  const session = useAuthStore((state) => state.session);
  const [email, setEmail] = useState("demo@clipforge.dev");
  const [name, setName] = useState("ClipForge Demo");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, name || undefined);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="space-y-8">
        <div className="space-y-5">
          <span className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-dusk ring-1 ring-ink/10">
            Browser-native recording
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-display text-5xl font-bold leading-tight text-ink sm:text-6xl">
              Record. Share. Done.
            </h1>
            <p className="max-w-2xl text-lg text-dusk">
              Screen recordings uploaded directly to the cloud. No middleman.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link to="/record">
            <Button variant="primary">Start Recording</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost">Go to Dashboard</Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            "Browser-native recording",
            "Direct-to-S3 upload",
            "Signed playback links"
          ].map((feature) => (
            <div key={feature} className="glass-panel rounded-[2rem] border border-white/60 p-5 shadow-soft">
              <p className="font-semibold text-ink">{feature}</p>
            </div>
          ))}
        </div>

        <footer className="text-sm text-dusk">ClipForge — Open Source Loom Alternative</footer>
      </section>

      <aside className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-soft">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.3em] text-dusk">Dev Access</p>
          <h2 className="mt-2 font-display text-3xl text-ink">MVP Login</h2>
        </div>

        {session ? (
          <div className="space-y-3">
            <p className="rounded-2xl bg-white/70 p-4 text-sm text-dusk">
              Signed in as <span className="font-semibold text-ink">{session.email}</span>
            </p>
            <Link to="/dashboard">
              <Button variant="secondary">Open Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-2 text-sm text-dusk">
              <span>Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none ring-0 focus:border-ember"
                placeholder="name@example.com"
                type="email"
              />
            </label>
            <label className="block space-y-2 text-sm text-dusk">
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none ring-0 focus:border-ember"
                placeholder="Optional display name"
              />
            </label>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button disabled={isSubmitting} onClick={handleLogin} variant="secondary">
              {isSubmitting ? "Signing In..." : "Sign In with Dev Login"}
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
};
