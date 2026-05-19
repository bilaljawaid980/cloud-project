import type { PublicVideoResponse } from "@clipforge/shared/types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../lib/api";
import { Button } from "../components/Button";
import { VideoCard } from "../components/VideoCard";

interface ListVideosResponse {
  videos: PublicVideoResponse[];
  nextCursor?: string;
}

type ViewFilter = "all" | "ready" | "processing" | "private";

export const DashboardPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<PublicVideoResponse[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [query, setQuery] = useState("");

  const loadVideos = async (nextCursor?: string, append = false): Promise<void> => {
    const setter = append ? setLoadingMore : setLoading;
    setter(true);
    setError(null);

    try {
      const response = await apiRequest<ListVideosResponse>(`/videos?limit=12${nextCursor ? `&cursor=${encodeURIComponent(nextCursor)}` : ""}`);
      setVideos((current) => (append ? [...current, ...response.videos] : response.videos));
      setCursor(response.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load videos.");
    } finally {
      setter(false);
    }
  };

  useEffect(() => {
    void loadVideos();
  }, []);

  const handleDelete = async (videoId: string): Promise<void> => {
    const previous = videos;
    setVideos((current) => current.filter((video) => video.videoId !== videoId));

    try {
      await apiRequest(`/videos/${videoId}`, {
        method: "DELETE"
      });
    } catch (deleteError) {
      setVideos(previous);
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return videos.filter((video) => {
      if (filter === "ready" && video.status !== "ready") return false;
      if (filter === "processing" && video.status !== "processing" && video.status !== "uploading" && video.status !== "uploaded") return false;
      if (filter === "private" && video.visibility !== "private") return false;
      if (!q) return true;
      return (
        video.title.toLowerCase().includes(q) ||
        (video.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [videos, filter, query]);

  const counts = useMemo(() => {
    const total = videos.length;
    const ready = videos.filter((v) => v.status === "ready").length;
    const processing = videos.filter(
      (v) => v.status === "processing" || v.status === "uploading" || v.status === "uploaded"
    ).length;
    const priv = videos.filter((v) => v.visibility === "private").length;
    return { total, ready, processing, priv };
  }, [videos]);

  const filterTabs: Array<{ value: ViewFilter; label: string; count: number }> = [
    { value: "all", label: "All", count: counts.total },
    { value: "ready", label: "Ready", count: counts.ready },
    { value: "processing", label: "Processing", count: counts.processing },
    { value: "private", label: "Private", count: counts.priv }
  ];

  return (
    <div className="space-y-9">
      <header className="flex flex-wrap items-end justify-between gap-6 animate-fade-up">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-ink/8 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-700 backdrop-blur">
            <span className="flex h-1.5 w-1.5 rounded-full bg-ember-600 shadow-[0_0_8px_rgba(122,16,24,0.7)]" />
            Library
          </div>
          <h1 className="font-display text-[44px] font-bold leading-[1.02] tracking-[-0.025em] text-ink sm:text-[56px]">
            Your recent <span className="maroon-text">clips.</span>
          </h1>
          <p className="max-w-xl text-[15px] text-ink-500">
            Every recording you've captured, with one-click sharing and a tidy overview.
          </p>
        </div>
        <Button onClick={() => navigate("/record")} variant="primary" size="lg" leftIcon={
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75 animate-pulse-dot" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
        }>
          New recording
        </Button>
      </header>

      <div className="surface edge-light relative grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink/[0.05] md:grid-cols-4">
        <Stat label="Total clips" value={counts.total} tint="brand" />
        <Stat label="Ready to share" value={counts.ready} tint="bright" />
        <Stat label="Processing" value={counts.processing} tint="deep" />
        <Stat label="Private" value={counts.priv} tint="ink" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="surface inline-flex items-center gap-1 rounded-2xl p-1">
          {filterTabs.map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all focus-ring ${
                  active
                    ? "bg-[linear-gradient(135deg,#a8313a_0%,#7a1018_100%)] text-white shadow-[0_6px_16px_-4px_rgba(122,16,24,0.55)] ring-1 ring-ember-700/40"
                    : "text-ink-500 hover:text-ember-700"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-ink/[0.06] text-ink-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="surface flex h-11 min-w-[260px] items-center gap-2.5 rounded-2xl px-3.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-400">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or description…"
            className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-300 outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="text-ink-400 hover:text-ember-700"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-ember-200 bg-ember-50 px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-ember-700">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4" />
            <circle cx="12" cy="16" r="0.6" fill="currentColor" />
          </svg>
          <p className="text-[13px] text-ember-700">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="surface overflow-hidden rounded-3xl">
              <div className="shimmer aspect-video" />
              <div className="space-y-3 p-5">
                <div className="shimmer h-4 w-3/4 rounded" />
                <div className="shimmer h-3 w-1/2 rounded" />
                <div className="shimmer h-9 w-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-elevated edge-light relative overflow-hidden rounded-4xl p-14 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(122,16,24,0.6),rgba(168,49,58,0.6),transparent)]" />
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-ember-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-ember-500/15 blur-3xl" />
          <div className="relative mx-auto max-w-md space-y-6">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#a8313a_0%,#7a1018_100%)] ring-1 ring-white/15 shadow-[0_12px_32px_-8px_rgba(122,16,24,0.55)]">
              <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="relative text-white">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M10 9.5v5l5-2.5L10 9.5z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-[28px] font-bold tracking-tight text-ink">
                {videos.length === 0 ? "Your library is quiet." : "Nothing matches."}
              </h2>
              <p className="mt-2 text-[14.5px] text-ink-500">
                {videos.length === 0
                  ? "Your first recording will appear here with a share link and playback card."
                  : "Try a different filter or clear your search."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button onClick={() => navigate("/record")} variant="primary">
                Record your first clip
              </Button>
              {videos.length > 0 ? (
                <Button onClick={() => { setQuery(""); setFilter("all"); }} variant="ghost">
                  Reset filters
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((video) => (
            <VideoCard
              key={video.videoId}
              video={video}
              onCopyLink={async (shareSlug) => {
                await navigator.clipboard.writeText(`${window.location.origin}/v/${shareSlug}`);
              }}
              onOpenVideo={(shareSlug) => navigate(`/v/${shareSlug}`)}
              onDelete={(videoId) => void handleDelete(videoId)}
            />
          ))}
        </div>
      )}

      {cursor ? (
        <div className="flex justify-center pt-4">
          <Button disabled={loadingMore} onClick={() => void loadVideos(cursor, true)} variant="ghost" size="lg">
            {loadingMore ? "Loading more…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

interface StatProps {
  label: string;
  value: number;
  tint?: "brand" | "bright" | "deep" | "ink";
}

const Stat = ({ label, value, tint }: StatProps): JSX.Element => {
  const dot =
    tint === "bright"
      ? "bg-ember-500 shadow-[0_0_8px_rgba(168,49,58,0.6)]"
      : tint === "deep"
        ? "bg-ember-800 shadow-[0_0_8px_rgba(68,10,16,0.5)]"
        : tint === "ink"
          ? "bg-ink-900"
          : "bg-ember-600 shadow-[0_0_8px_rgba(122,16,24,0.6)]";
  return (
    <div className="flex items-center justify-between bg-white/85 px-5 py-4">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink-400">{label}</p>
        <p className="mt-1 font-display text-[28px] font-bold tabular-nums tracking-tight text-ink">
          {value}
        </p>
      </div>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
    </div>
  );
};
