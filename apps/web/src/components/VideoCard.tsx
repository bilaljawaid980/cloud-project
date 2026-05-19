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
  <article className="glass-panel flex flex-col gap-4 rounded-[2rem] border border-white/60 p-5 shadow-soft">
    {video.thumbnailUrl ? (
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="aspect-video w-full rounded-2xl object-cover"
      />
    ) : (
      <div className="grid-glow aspect-video rounded-2xl border border-dashed border-ink/10" />
    )}

    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge tone={video.status} />
      <StatusBadge tone={video.visibility} />
    </div>

    <div>
      <h3 className="font-display text-2xl text-ink">{video.title}</h3>
      <p className="mt-2 text-sm text-dusk">{video.description || "No description added yet."}</p>
    </div>

    <div className="text-sm text-dusk">Created {formatDateTime(video.createdAt)}</div>

    <div className="flex flex-wrap gap-3">
      <Button onClick={() => onOpenVideo(video.shareSlug)} variant="primary">
        Open
      </Button>
      <Button onClick={() => onCopyLink(video.shareSlug)} variant="secondary">
        Copy Link
      </Button>
      <Button onClick={() => onDelete(video.videoId)} variant="ghost">
        Delete
      </Button>
    </div>
  </article>
);
