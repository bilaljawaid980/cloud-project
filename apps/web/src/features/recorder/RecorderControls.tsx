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

export const RecorderControls = ({
  status,
  durationMs,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset
}: RecorderControlsProps): JSX.Element => (
  <div className="glass-panel flex flex-col gap-4 rounded-3xl border border-white/60 p-5 shadow-soft">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-dusk">Recorder</p>
        <h3 className="font-display text-2xl text-ink">{formatDuration(durationMs)}</h3>
      </div>
      <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
        {status}
      </span>
    </div>

    <div className="flex flex-wrap gap-3">
      {(status === "idle" || status === "error") && (
        <Button onClick={onStart} variant="primary">
          Start Recording
        </Button>
      )}
      {status === "recording" && (
        <>
          <Button onClick={onPause} variant="secondary">
            Pause
          </Button>
          <Button onClick={onStop} variant="primary">
            Stop
          </Button>
        </>
      )}
      {status === "paused" && (
        <>
          <Button onClick={onResume} variant="secondary">
            Resume
          </Button>
          <Button onClick={onStop} variant="primary">
            Stop
          </Button>
        </>
      )}
      {status === "stopped" && (
        <Button onClick={onReset} variant="ghost">
          Reset Recorder
        </Button>
      )}
    </div>
  </div>
);
