import { useEffect, useMemo, useRef, useState } from "react";

interface CameraBubbleProps {
  stream: MediaStream | null;
}

export const CameraBubble = ({ stream }: CameraBubbleProps): JSX.Element | null => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
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
      className="fixed bottom-6 right-6 z-30 w-52 cursor-grab overflow-hidden rounded-3xl border border-white/70 bg-ink shadow-soft"
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        dragRef.current = {
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top
        };
      }}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    >
      <video ref={videoRef} autoPlay muted playsInline className="aspect-video h-full w-full object-cover" />
    </div>
  );
};
