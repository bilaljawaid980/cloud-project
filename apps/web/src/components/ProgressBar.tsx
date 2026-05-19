interface ProgressBarProps {
  value: number;
  label?: string;
  hint?: string;
  indeterminate?: boolean;
}

export const ProgressBar = ({ value, label, hint, indeterminate }: ProgressBarProps): JSX.Element => {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-[0.2em] text-ink-500">
          {label ?? "Progress"}
        </span>
        <span className="font-mono text-[11px] text-ink-600 tabular-nums">
          {indeterminate ? "…" : `${Math.round(pct)}%`}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-ink/[0.06] ring-1 ring-ink/5">
        {indeterminate ? (
          <div className="absolute inset-y-0 -left-1/3 w-1/3 rounded-full bg-gradient-to-r from-transparent via-ember-600 to-transparent animate-shimmer" />
        ) : (
          <>
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#a8313a_0%,#7a1018_55%,#440a10_100%)] bg-[length:200%_100%] animate-gradient-x shadow-[0_0_20px_rgba(122,16,24,0.55)] transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
            {pct > 0 && pct < 100 ? (
              <span
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-[0_0_12px_rgba(122,16,24,0.9),0_0_0_1px_rgba(122,16,24,0.3)] transition-[left] duration-500 ease-out"
                style={{ left: `calc(${pct}% - 6px)` }}
              />
            ) : null}
          </>
        )}
      </div>
      {hint ? <p className="text-[11px] text-ink-500">{hint}</p> : null}
    </div>
  );
};
