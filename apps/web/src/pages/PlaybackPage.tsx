import type { PlaybackUrlResponse, PublicVideoResponse } from "@clipforge/shared/types";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ApiClientError, apiRequest } from "../lib/api";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime } from "../lib/time";

type PlaybackState = "loading" | "ready" | "forbidden" | "not-found" | "error";

export const PlaybackPage = (): JSX.Element => {
  const { shareSlug = "" } = useParams();
  const hasSentViewEventRef = useRef(false);
  const viewTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [meta, setMeta] = useState<PublicVideoResponse | null>(null);
  const [playback, setPlayback] = useState<PlaybackUrlResponse | null>(null);
  const [state, setState] = useState<PlaybackState>("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setState("loading");

      try {
        const video = await apiRequest<PublicVideoResponse>(`/share/${shareSlug}`);
        const playbackUrl = await apiRequest<PlaybackUrlResponse>(`/videos/${video.videoId}/playback-url`, {
          method: "POST"
        });

        setMeta(video);
        setPlayback(playbackUrl);
        setState("ready");
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.status === 403) {
            setState("forbidden");
            return;
          }

          if (error.status === 404) {
            setState("not-found");
            return;
          }
        }

        setState("error");
      }
    };

    void load();

    return () => {
      if (viewTimerRef.current !== null) {
        window.clearTimeout(viewTimerRef.current);
      }
    };
  }, [shareSlug]);

  const scheduleViewEvent = (): void => {
    if (!meta || hasSentViewEventRef.current || viewTimerRef.current !== null) {
      return;
    }

    viewTimerRef.current = window.setTimeout(() => {
      hasSentViewEventRef.current = true;
      viewTimerRef.current = null;
      void apiRequest(`/videos/${meta.videoId}/view-events`, {
        method: "POST",
        body: JSON.stringify({ watchedMs: Math.floor((videoRef.current?.currentTime ?? 3) * 1000) })
      });
    }, 3000);
  };

  const clearViewTimer = (): void => {
    if (viewTimerRef.current !== null) {
      window.clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
  };

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (state !== "ready" || !meta || !playback) {
    return <PlaybackStateView state={state} />;
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-6 animate-fade-up">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={meta.status} />
            <StatusBadge tone={meta.visibility} />
            <span className="text-[12px] text-ink-400">
              · Published {formatDateTime(meta.createdAt)}
            </span>
          </div>
          <h1 className="font-display text-[36px] font-bold leading-[1.05] tracking-[-0.022em] text-ink sm:text-[44px]">
            {meta.title}
          </h1>
          {meta.description ? (
            <p className="max-w-3xl text-[15px] leading-relaxed text-ink-500">{meta.description}</p>
          ) : (
            <p className="text-[14px] italic text-ink-400">No description provided.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => void handleCopy()}
            variant="primary"
            leftIcon={
              copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="m5 12 5 5L20 7" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
              )
            }
          >
            {copied ? "Copied!" : "Copy share link"}
          </Button>
        </div>
      </header>

      <div className="surface-dark relative overflow-hidden rounded-3xl">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(168,49,58,0.7),rgba(122,16,24,0.7),transparent)]" />
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08] ring-1 ring-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08] ring-1 ring-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08] ring-1 ring-white/10" />
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/40">
            clipforge · playback
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/40">
            {playback.mode}
          </span>
        </div>
        <video
          ref={videoRef}
          controls
          playsInline
          poster={meta.thumbnailUrl}
          src={playback.url}
          className="aspect-video w-full bg-black object-contain"
          onPlay={scheduleViewEvent}
          onPause={clearViewTimer}
          onEnded={clearViewTimer}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="surface edge-light relative rounded-3xl p-6">
          <p className="eyebrow">Share link</p>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-ink/8 bg-white/70 p-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#a8313a,#7a1018)] text-white ring-1 ring-white/15 shadow-[0_8px_18px_-6px_rgba(122,16,24,0.6)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
                <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
              </svg>
            </span>
            <code className="flex-1 truncate font-mono text-[12px] text-ink-700">
              {typeof window !== "undefined" ? window.location.href : ""}
            </code>
            <button
              onClick={() => void handleCopy()}
              className="rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-700 hover:border-ember-700/30 hover:text-ember-700 focus-ring"
            >
              {copied ? "Done" : "Copy"}
            </button>
          </div>
          <p className="mt-3 text-[12.5px] text-ink-500">
            Anyone with this link and access to the visibility above can stream the clip.
          </p>
        </div>

        <div className="surface edge-light relative rounded-3xl p-6">
          <p className="eyebrow">Delivery</p>
          <div className="mt-4 space-y-3 text-[13px]">
            <Row k="Mode" v={playback.mode} mono />
            <Row k="Status" v={meta.status} />
            <Row k="Visibility" v={meta.visibility} />
            <Row k="Published" v={formatDateTime(meta.createdAt)} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface RowProps {
  k: string;
  v: string;
  mono?: boolean;
}

const Row = ({ k, v, mono }: RowProps): JSX.Element => (
  <div className="flex items-center justify-between border-b border-ink/[0.05] pb-3 last:border-0 last:pb-0">
    <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-ink-400">{k}</span>
    <span className={`text-[13px] text-ink-700 ${mono ? "font-mono text-[12.5px]" : "font-medium"}`}>
      {v}
    </span>
  </div>
);

const PlaybackStateView = ({ state }: { state: PlaybackState }): JSX.Element => {
  if (state === "loading") {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="shimmer h-3 w-24 rounded" />
          <div className="shimmer h-10 w-3/4 rounded" />
          <div className="shimmer h-4 w-1/2 rounded" />
        </div>
        <div className="surface-dark overflow-hidden rounded-3xl">
          <div className="grid-glow-dark aspect-video flex items-center justify-center">
            <div className="flex items-center gap-3 text-white/55">
              <span className="h-2 w-2 rounded-full bg-ember-400 shadow-[0_0_8px_rgba(207,94,98,0.9)] animate-pulse-dot" />
              <span className="font-mono text-[12px] uppercase tracking-[0.22em]">Loading playback…</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = {
    forbidden: {
      eyebrow: "403 · private",
      title: "This clip is private.",
      body: "Only the owner can view this recording. If you think this is a mistake, ask them to flip visibility to unlisted or public.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      )
    },
    "not-found": {
      eyebrow: "404 · missing",
      title: "We couldn't find that clip.",
      body: "The link may have expired, been deleted, or never existed. Double-check the URL or head back to your library.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      )
    },
    error: {
      eyebrow: "playback error",
      title: "Playback failed to load.",
      body: "Something went wrong reaching the storage service. Try refreshing, or open another clip from your library.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <circle cx="12" cy="16" r="0.6" fill="currentColor" />
        </svg>
      )
    }
  } as const;

  const c = content[state as keyof typeof content];

  return (
    <div className="surface-elevated edge-light relative overflow-hidden rounded-4xl px-8 py-16 text-center">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(122,16,24,0.6),rgba(168,49,58,0.6),transparent)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ember-600/22 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-ember-500/18 blur-3xl" />
      <div className="relative mx-auto max-w-lg space-y-5">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#a8313a,#7a1018)] ring-1 ring-white/15 shadow-[0_12px_32px_-8px_rgba(122,16,24,0.55)]">
          <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
          <span className="relative text-white">{c.icon}</span>
        </div>
        <span className="eyebrow">{c.eyebrow}</span>
        <h2 className="font-display text-[28px] font-bold tracking-tight text-ink">{c.title}</h2>
        <p className="text-[14.5px] text-ink-500">{c.body}</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Link to="/dashboard"><Button variant="primary">Back to library</Button></Link>
          <Link to="/"><Button variant="ghost">Home</Button></Link>
        </div>
      </div>
    </div>
  );
};
