import type { PlaybackUrlResponse, PublicVideoResponse } from "@clipforge/shared/types";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { ApiClientError, apiRequest } from "../lib/api";
import { Button } from "../components/Button";
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

  if (state !== "ready" || !meta || !playback) {
    const message =
      state === "forbidden"
        ? "This clip is private and requires the owner."
        : state === "not-found"
          ? "We couldn’t find that clip."
          : state === "error"
            ? "Playback failed to load."
            : "Loading playback...";

    return <div className="py-20 text-center text-dusk">{message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-dusk">Playback</p>
          <h1 className="mt-2 font-display text-4xl text-ink">{meta.title}</h1>
          <p className="mt-3 max-w-3xl text-dusk">{meta.description || "No description provided."}</p>
        </div>
        <Button
          onClick={() => void navigator.clipboard.writeText(window.location.href)}
          variant="secondary"
        >
          Copy Link
        </Button>
      </div>

      <div className="glass-panel overflow-hidden rounded-[2rem] border border-white/60 shadow-soft">
        <video
          ref={videoRef}
          controls
          playsInline
          poster={meta.thumbnailUrl}
          src={playback.url}
          className="aspect-video w-full bg-ink object-contain"
          onPlay={scheduleViewEvent}
          onPause={clearViewTimer}
          onEnded={clearViewTimer}
        />
      </div>

      <div className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-soft">
        <p className="text-sm text-dusk">Published {formatDateTime(meta.createdAt)}</p>
        <p className="mt-2 text-sm text-dusk">Delivery mode: {playback.mode}</p>
      </div>
    </div>
  );
};
