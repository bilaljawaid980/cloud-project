interface ProgressBarProps {
  value: number;
  label?: string;
}

export const ProgressBar = ({ value, label }: ProgressBarProps): JSX.Element => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm text-dusk">
      <span>{label ?? "Progress"}</span>
      <span>{Math.round(value)}%</span>
    </div>
    <div className="h-3 overflow-hidden rounded-full bg-white/70 ring-1 ring-ink/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-ember to-sea transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);
