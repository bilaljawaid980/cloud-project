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

  const hasStream = Boolean(liveStream) || Boolean(previewUrl);

  return (
    <div className="surface-dark group relative overflow-hidden rounded-3xl">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(168,49,58,0.65),rgba(122,16,24,0.65),transparent)]" />

      <div className="relative flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08] ring-1 ring-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08] ring-1 ring-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08] ring-1 ring-white/10" />
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/40">
          {liveStream ? "live • capture" : previewUrl ? "preview • ready" : "preview • idle"}
        </span>
        <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] ring-1 ${
          liveStream
            ? "bg-ember-500/15 text-ember-300 ring-ember-500/40"
            : "bg-white/[0.04] text-white/40 ring-white/10"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${liveStream ? "bg-ember-400 shadow-[0_0_8px_rgba(207,94,98,0.9)] animate-pulse-dot" : "bg-white/20"}`} />
          <span>{liveStream ? "rec" : "off"}</span>
        </span>
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay={Boolean(liveStream)}
          controls={Boolean(previewUrl)}
          muted={!previewUrl}
          playsInline
          src={previewUrl ?? undefined}
          className="aspect-video w-full bg-black object-contain"
          onLoadedData={(event) => onVideoReady?.(event.currentTarget)}
        />

        {!hasStream ? (
          <div className="absolute inset-0 grid-glow-dark flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(168,49,58,0.35)_0%,rgba(122,16,24,0.25)_100%)] ring-1 ring-ember-400/40 shadow-[0_8px_32px_-8px_rgba(122,16,24,0.6)]">
                <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="relative text-white">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M10 9.5v5l4.5-2.5L10 9.5z" fill="currentColor" />
                </svg>
              </div>
              <div>
                <p className="font-display text-base font-semibold text-white">
                  Preview will appear here
                </p>
                <p className="mt-1.5 text-[12.5px] text-white/45">
                  Pick a capture mode and hit start recording
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
