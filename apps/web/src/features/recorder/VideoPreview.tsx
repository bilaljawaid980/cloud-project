import { useEffect, useRef } from "react";

interface VideoPreviewProps {
  liveStream: MediaStream | null;
  previewUrl: string | null;
  onVideoReady?: (element: HTMLVideoElement) => void;
}

export const VideoPreview = ({ liveStream, previewUrl, onVideoReady }: VideoPreviewProps): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    if (liveStream) {
      videoRef.current.srcObject = liveStream;
      return;
    }

    videoRef.current.srcObject = null;
  }, [liveStream]);

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem] border border-white/60 shadow-soft">
      <video
        ref={videoRef}
        autoPlay={Boolean(liveStream)}
        controls={Boolean(previewUrl)}
        muted={!previewUrl}
        playsInline
        src={previewUrl ?? undefined}
        className="aspect-video w-full bg-ink object-contain"
        onLoadedData={(event) => onVideoReady?.(event.currentTarget)}
      />
    </div>
  );
};
