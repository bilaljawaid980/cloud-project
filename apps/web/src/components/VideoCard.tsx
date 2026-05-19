import type { PublicVideoResponse } from "@clipforge/shared/types";

import { formatDateTime } from "../lib/time";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";

interface VideoCardProps {
  video: PublicVideoResponse;
  onCopyLink: (shareSlug: string) => void;
  onOpenVideo: (shareSlug: string) => void;
  onDelete: (videoId: string) => void;
}

export const VideoCard = ({
  video,
  onCopyLink,
  onOpenVideo,
  onDelete
}: VideoCardProps): JSX.Element => (
  <article className="group surface edge-light relative flex flex-col overflow-hidden rounded-3xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-lift">
    {/* Maroon ring that lights up on hover */}
    <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
      <div className="absolute inset-0 rounded-3xl ring-1 ring-ember-600/40" />
    </div>

    <button
      type="button"
      onClick={() => onOpenVideo(video.shareSlug)}
      className="relative block overflow-hidden focus-ring"
      aria-label={`Open ${video.title}`}
    >
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="aspect-video w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="grid-glow-dark aspect-video w-full" />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/0 to-ink-900/0 opacity-50 transition-opacity duration-300 group-hover:opacity-95" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-ember-700 shadow-[0_8px_24px_rgba(122,16,24,0.4),0_0_0_8px_rgba(255,255,255,0.2)] backdrop-blur ring-1 ring-ember-300/40">
          <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
            <path d="M2 2.5v15l14-7.5L2 2.5z" fill="currentColor" />
          </svg>
        </span>
      </div>

      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge tone={video.status} />
        <StatusBadge tone={video.visibility} />
      </div>
    </button>

    <div className="relative flex flex-1 flex-col gap-4 p-5">
      <div className="space-y-1.5">
        <h3 className="line-clamp-1 font-display text-[17px] font-semibold tracking-tight text-ink">
          {video.title}
        </h3>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-500">
          {video.description || "No description added yet."}
        </p>
      </div>

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-400">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        {formatDateTime(video.createdAt)}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-ink/[0.06] pt-4">
        <Button onClick={() => onOpenVideo(video.shareSlug)} variant="primary" size="sm">
          Open
        </Button>
        <Button onClick={() => onCopyLink(video.shareSlug)} variant="ghost" size="sm">
          Copy link
        </Button>
        <button
          type="button"
          onClick={() => onDelete(video.videoId)}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition-all hover:bg-ember-50 hover:text-ember-700 focus-ring"
          aria-label="Delete"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      </div>
    </div>
  </article>
);
