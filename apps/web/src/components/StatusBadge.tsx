import type { VideoStatus, VideoVisibility } from "@clipforge/shared/types";

type Tone = VideoStatus | VideoVisibility;

interface StatusBadgeProps {
  tone: Tone;
  label?: string;
}

const styleMap: Record<Tone, { wrap: string; dot: string; pulse?: boolean }> = {
  created: {
    wrap: "bg-white/70 text-ink-600 ring-1 ring-ink/10",
    dot: "bg-ink-400"
  },
  uploading: {
    wrap: "bg-ember-50 text-ember-700 ring-1 ring-ember-200",
    dot: "bg-ember-500 shadow-[0_0_8px_rgba(168,49,58,0.7)]",
    pulse: true
  },
  uploaded: {
    wrap: "bg-ember-50 text-ember-700 ring-1 ring-ember-200",
    dot: "bg-ember-500"
  },
  processing: {
    wrap: "bg-ember-50 text-ember-700 ring-1 ring-ember-200",
    dot: "bg-ember-500 shadow-[0_0_8px_rgba(168,49,58,0.7)]",
    pulse: true
  },
  ready: {
    wrap: "bg-ember-50 text-ember-700 ring-1 ring-ember-200",
    dot: "bg-ember-600 shadow-[0_0_8px_rgba(122,16,24,0.7)]"
  },
  failed: {
    wrap: "bg-ember-100 text-ember-800 ring-1 ring-ember-300",
    dot: "bg-ember-800"
  },
  deleted: {
    wrap: "bg-ink-50 text-ink-400 ring-1 ring-ink/10",
    dot: "bg-ink-300"
  },
  private: {
    wrap: "bg-ink text-white ring-1 ring-ink/30",
    dot: "bg-ember-400 shadow-[0_0_8px_rgba(207,94,98,0.8)]"
  },
  unlisted: {
    wrap: "bg-white text-ink-700 ring-1 ring-ink/15",
    dot: "bg-ember-500"
  },
  public: {
    wrap: "bg-[linear-gradient(120deg,#7a1018_0%,#a8313a_100%)] text-white ring-1 ring-ember-700",
    dot: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
  }
};

export const StatusBadge = ({ tone, label }: StatusBadgeProps): JSX.Element => {
  const style = styleMap[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md ${style.wrap}`}
    >
      <span
        className={`relative h-1.5 w-1.5 rounded-full ${style.dot} ${style.pulse ? "animate-pulse-dot" : ""}`}
      />
      {label ?? tone}
    </span>
  );
};
