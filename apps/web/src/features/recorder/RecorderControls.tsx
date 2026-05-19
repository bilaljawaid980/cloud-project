import { Button } from "../../components/Button";
import { formatDuration } from "../../lib/time";
import type { RecorderStatus } from "./recorder";

interface RecorderControlsProps {
  status: RecorderStatus;
  durationMs: number;
  onStart: () => void | Promise<void>;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void | Promise<void>;
  onReset: () => void;
}

const statusMeta: Record<RecorderStatus, { label: string; dot: string; tint: string; tile: string }> = {
  idle: {
    label: "Idle",
    dot: "bg-ink-300",
    tint: "text-ink-500",
    tile: "bg-ink/[0.04] ring-ink/10"
  },
  requesting: {
    label: "Requesting",
    dot: "bg-ember-500 shadow-[0_0_8px_rgba(168,49,58,0.7)] animate-pulse-dot",
    tint: "text-ember-700",
    tile: "bg-ember-50 ring-ember-200"
  },
  recording: {
    label: "Recording",
    dot: "bg-ember-600 shadow-[0_0_10px_rgba(122,16,24,0.85)] animate-pulse-dot",
    tint: "text-ember-700",
    tile: "bg-ember-100 ring-ember-300"
  },
  paused: {
    label: "Paused",
    dot: "bg-ember-400 shadow-[0_0_8px_rgba(207,94,98,0.55)]",
    tint: "text-ember-600",
    tile: "bg-ember-50 ring-ember-200"
  },
  stopped: {
    label: "Stopped",
    dot: "bg-ink-900",
    tint: "text-ink",
    tile: "bg-ink/[0.06] ring-ink/15"
  },
  error: {
    label: "Error",
    dot: "bg-ember-800",
    tint: "text-ember-800",
    tile: "bg-ember-100 ring-ember-300"
  }
} as const;

export const RecorderControls = ({
  status,
  durationMs,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset
}: RecorderControlsProps): JSX.Element => {
  const meta = statusMeta[status];

  return (
    <div className="surface edge-light relative overflow-hidden rounded-3xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${meta.tile}`}>
            <span className={`h-3 w-3 rounded-full ${meta.dot}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              <span className={meta.tint}>{meta.label}</span>
              <span className="text-ink-300">·</span>
              <span>duration</span>
            </div>
            <div className="font-display text-[30px] font-bold leading-none tracking-tight text-ink mt-1.5 tabular-nums">
              {formatDuration(durationMs)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {(status === "idle" || status === "error") && (
            <Button onClick={onStart} variant="primary" size="lg" leftIcon={
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75 animate-pulse-dot" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
            }>
              Start recording
            </Button>
          )}
          {status === "recording" && (
            <>
              <Button onClick={onPause} variant="ghost" size="lg">
                Pause
              </Button>
              <Button onClick={onStop} variant="secondary" size="lg">
                Stop
              </Button>
            </>
          )}
          {status === "paused" && (
            <>
              <Button onClick={onResume} variant="primary" size="lg">
                Resume
              </Button>
              <Button onClick={onStop} variant="secondary" size="lg">
                Stop
              </Button>
            </>
          )}
          {status === "stopped" && (
            <Button onClick={onReset} variant="ghost" size="lg">
              Reset recorder
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
