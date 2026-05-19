import type { PublicVideoResponse } from "@clipforge/shared/types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../lib/api";
import { Button } from "../components/Button";
import { VideoCard } from "../components/VideoCard";

interface ListVideosResponse {
  videos: PublicVideoResponse[];
  nextCursor?: string;
}

export const DashboardPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<PublicVideoResponse[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-dusk">Dashboard</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Your recent clips</h1>
        </div>
        <Button onClick={() => navigate("/record")} variant="secondary">
          Record Another Clip
        </Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {loading ? (
        <div className="py-16 text-center text-dusk">Loading your library...</div>
      ) : videos.length === 0 ? (
        <div className="glass-panel rounded-[2rem] border border-white/60 p-10 text-center shadow-soft">
          <h2 className="font-display text-3xl text-ink">No videos yet</h2>
          <p className="mt-3 text-dusk">Your first recording will show up here with a share link and playback card.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
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
        <Button disabled={loadingMore} onClick={() => void loadVideos(cursor, true)} variant="ghost">
          {loadingMore ? "Loading More..." : "Load More"}
        </Button>
      ) : null}
    </div>
  );
};
