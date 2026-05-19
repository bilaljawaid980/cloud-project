import type { VideoStatus, VideoVisibility } from "@clipforge/shared/types";

interface StatusBadgeProps {
  tone: VideoStatus | VideoVisibility;
}

const toneMap: Record<VideoStatus | VideoVisibility, string> = {
  created: "bg-slate-100 text-slate-700",
  uploading: "bg-orange-100 text-orange-700",
  uploaded: "bg-sky-100 text-sky-700",
  processing: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  deleted: "bg-slate-200 text-slate-600",
  private: "bg-slate-900 text-white",
  unlisted: "bg-teal-100 text-teal-700",
  public: "bg-indigo-100 text-indigo-700"
};

export const StatusBadge = ({ tone }: StatusBadgeProps): JSX.Element => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneMap[tone]}`}>
    {tone}
  </span>
);
