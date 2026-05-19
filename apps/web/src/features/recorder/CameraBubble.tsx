import { useEffect, useMemo, useRef, useState } from "react";

interface CameraBubbleProps {
  stream: MediaStream | null;
}

export const CameraBubble = ({ stream }: CameraBubbleProps): JSX.Element | null => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const visible = useMemo(() => Boolean(stream), [stream]);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current) {
        return;
      }

      setPosition({
        x: event.clientX - dragRef.current.offsetX,
        y: event.clientY - dragRef.current.offsetY
      });
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-8 right-8 z-40 w-56 overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6),0_0_40px_-8px_rgba(122,16,24,0.45)] ring-1 ring-ember-600/30 ${
        dragging ? "cursor-grabbing scale-[1.03]" : "cursor-grab"
      } transition-transform duration-200`}
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        dragRef.current = {
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top
        };
        setDragging(true);
      }}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(168,49,58,0.7),transparent)]" />
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
          Camera
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ember-300">
          <span className="h-1.5 w-1.5 rounded-full bg-ember-400 shadow-[0_0_8px_rgba(207,94,98,0.9)] animate-pulse-dot" />
          live
        </span>
      </div>
      <video ref={videoRef} autoPlay muted playsInline className="aspect-video h-full w-full object-cover" />
    </div>
  );
};
