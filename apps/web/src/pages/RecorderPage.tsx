import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { VideoVisibility } from "@clipforge/shared/types";

import { Button } from "../components/Button";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";
import { env } from "../lib/env";
import { captureVideoThumbnail } from "../features/recorder/thumbnail";
import { CameraBubble } from "../features/recorder/CameraBubble";
import { getCapabilities, isRecordingSupported } from "../features/recorder/mediaSupport";
import { RecorderControls } from "../features/recorder/RecorderControls";
import { useRecorderStore, type RecorderMode } from "../features/recorder/recorder";
import { VideoPreview } from "../features/recorder/VideoPreview";
import { cancelUpload, uploadRecording, useUploadStore } from "../features/upload/multipartUploader";

const modeMeta: Record<RecorderMode, { label: string; sub: string; icon: JSX.Element }> = {
  screen: {
    label: "Screen",
    sub: "Tab or window",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 18v3" />
      </svg>
    )
  },
  screen_mic: {
    label: "Screen + Mic",
    sub: "Voiceover walkthrough",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="14" height="10" rx="2" />
        <path d="M19 9v3a3 3 0 0 1-6 0V9" />
        <path d="M16 18v3" />
      </svg>
    )
  },
  screen_camera_mic: {
    label: "Screen + Cam + Mic",
    sub: "Full production",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="14" height="10" rx="2" />
        <circle cx="18" cy="18" r="3.5" />
      </svg>
    )
  },
  camera: {
    label: "Camera",
    sub: "Talking-head clip",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" />
      </svg>
    )
  }
};

export const RecorderPage = (): JSX.Element => {
  const navigate = useNavigate();
  const recorder = useRecorderStore();
  const uploadState = useUploadStore();
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const capabilities = useMemo(() => getCapabilities(), []);
  const supported = useMemo(() => isRecordingSupported(), []);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [thumbnailBase64, setThumbnailBase64] = useState<string | null>(null);
  const [title, setTitle] = useState("New Clip");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<VideoVisibility>("private");

  const uploadStatusTone =
    uploadState.status === "success"
      ? "ready"
      : uploadState.status === "error" || uploadState.status === "cancelled"
        ? "failed"
        : uploadState.status === "creating" ||
            uploadState.status === "uploading" ||
            uploadState.status === "completing"
          ? "uploading"
          : "created";

  const uploadHint =
    uploadState.status === "creating"
      ? "Provisioning multipart session…"
      : uploadState.status === "uploading"
        ? "Streaming parts directly to storage"
        : uploadState.status === "completing"
          ? "Finalizing upload…"
          : uploadState.status === "success"
            ? "Upload complete — opening playback"
            : undefined;

  useEffect(() => {
    return () => {
      useRecorderStore.getState().reset();
      useUploadStore.getState().reset();
    };
  }, []);

  const handleStop = async (): Promise<void> => {
    const blob = await recorder.stop();
    setRecordedBlob(blob);
  };

  const handleUpload = async (): Promise<void> => {
    if (!recordedBlob || !recorder.mimeType) {
      return;
    }

    const result = await uploadRecording({
      blob: recordedBlob,
      title,
      description,
      visibility,
      mimeType: recorder.mimeType,
      recordingType: recorder.mode,
      thumbnailBase64
    });

    navigate(`/v/${result.shareSlug}`);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-4 animate-fade-up">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-ink/8 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-700 backdrop-blur">
            <span className="flex h-1.5 w-1.5 rounded-full bg-ember-600 shadow-[0_0_8px_rgba(122,16,24,0.8)] animate-pulse-dot" />
            Studio
          </div>
          <h1 className="font-display text-[44px] font-bold leading-[1.02] tracking-[-0.025em] text-ink sm:text-[56px]">
            Capture once.
            <br />
            <span className="maroon-text">Ship instantly.</span>
          </h1>
          <p className="max-w-xl text-[15px] text-ink-500">
            A focused recording workspace — preview, controls, and upload pipeline laid out for
            zero-friction async video.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 animate-fade-up">
          <StatusBadge tone={supported ? "ready" : "failed"} label={supported ? "Recorder ready" : "Unsupported"} />
          {env.devMode ? <StatusBadge tone="private" label="Dev mode" /> : null}
        </div>
      </header>

      <div className="surface edge-light relative grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-ink/[0.05] sm:grid-cols-3">
        <Capability label="Display capture" value={capabilities.hasDisplayCapture ? "Available" : "Unavailable"} ok={capabilities.hasDisplayCapture} />
        <Capability label="Camera / Mic" value={capabilities.hasUserMedia ? "Available" : "Unavailable"} ok={capabilities.hasUserMedia} />
        <Capability label="Encoder" value={capabilities.mimeType ?? "unsupported"} mono ok={Boolean(capabilities.mimeType)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="surface edge-light relative rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Capture mode</p>
                <p className="mt-1 text-[14px] text-ink-700">
                  Choose what to record — change anytime before pressing start.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(modeMeta) as RecorderMode[]).map((mode) => {
                const meta = modeMeta[mode];
                const active = recorder.mode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => recorder.setMode(mode)}
                    className={`group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border p-3.5 text-left transition-all focus-ring ${
                      active
                        ? "border-ember-700/50 bg-[linear-gradient(135deg,#a8313a_0%,#7a1018_100%)] text-white shadow-[0_10px_24px_-8px_rgba(122,16,24,0.55)]"
                        : "border-ink/10 bg-white/70 text-ink-700 hover:-translate-y-[1px] hover:border-ember-700/30 hover:bg-white"
                    }`}
                  >
                    {active ? (
                      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)]" />
                    ) : null}
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        active
                          ? "bg-white/15 text-white ring-1 ring-white/25"
                          : "bg-ink/[0.04] text-ink-600 ring-1 ring-ink/10"
                      }`}
                    >
                      {meta.icon}
                    </span>
                    <span className="font-display text-[13.5px] font-semibold">{meta.label}</span>
                    <span className={`text-[11.5px] ${active ? "text-white/75" : "text-ink-500"}`}>
                      {meta.sub}
                    </span>
                    {active ? (
                      <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)] animate-pulse-dot" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <VideoPreview
            liveStream={recorder.livePreviewStream}
            previewUrl={recorder.previewUrl}
            onVideoReady={async (videoEl) => {
              previewVideoRef.current = videoEl;
              if (!recorder.previewUrl) {
                return;
              }

              const thumbnail = await captureVideoThumbnail(videoEl);
              setThumbnailBase64(thumbnail);
            }}
          />

          <RecorderControls
            durationMs={recorder.durationMs}
            status={recorder.status}
            onStart={() => void recorder.start()}
            onPause={recorder.pause}
            onResume={recorder.resume}
            onStop={() => void handleStop()}
            onReset={() => {
              recorder.reset();
              setRecordedBlob(null);
              setThumbnailBase64(null);
            }}
          />

          {recorder.error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-ember-200 bg-ember-50 px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-ember-700">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4" />
                <circle cx="12" cy="16" r="0.6" fill="currentColor" />
              </svg>
              <div>
                <p className="text-[13px] font-semibold text-ember-800">Recording failed</p>
                <p className="mt-0.5 text-[12.5px] text-ember-700">{recorder.error}</p>
              </div>
            </div>
          ) : null}

          <p className="text-[12.5px] text-ink-500">
            Grant screen, camera, and microphone permissions when prompted. In
            <span className="mx-1 rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[11.5px] text-ink-700 ring-1 ring-ink/10">
              screen_camera_mic
            </span>
            mode the camera bubble is a live overlay — true compositing lands post-MVP.
          </p>
        </div>

        <div className="space-y-5">
          <section className="surface edge-light relative rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Clip details</p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                  Metadata
                </h2>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-400 tabular-nums">
                {title.length}/200
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <FormField label="Title">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  placeholder="What's this clip about?"
                  className="h-11 w-full rounded-xl border border-ink/10 bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-300 focus-ring"
                />
              </FormField>

              <FormField label="Description" hint={`${description.length}/2000`}>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                  placeholder="Optional context for viewers…"
                  className="h-28 w-full resize-none rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-ink placeholder:text-ink-300 focus-ring"
                />
              </FormField>

              <FormField label="Visibility">
                <div className="grid grid-cols-3 gap-2">
                  {(["private", "unlisted", "public"] as VideoVisibility[]).map((v) => {
                    const active = visibility === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVisibility(v)}
                        className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all focus-ring ${
                          active
                            ? "border-ember-700/50 bg-ember-50 text-ember-700"
                            : "border-ink/10 bg-white text-ink-700 hover:border-ember-700/30"
                        }`}
                      >
                        <span className="text-[13px] font-semibold capitalize">{v}</span>
                        <span className={`text-[11px] ${active ? "text-ember-600" : "text-ink-400"}`}>
                          {v === "private" ? "Only you" : v === "unlisted" ? "Anyone with link" : "Public link"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FormField>
            </div>
          </section>

          <section className="surface edge-light relative rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Pipeline</p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                  Upload
                </h2>
              </div>
              <StatusBadge tone={uploadStatusTone} />
            </div>

            <div className="mt-5 space-y-4">
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-ink/10">
                {thumbnailBase64 ? (
                  <img
                    src={`data:image/jpeg;base64,${thumbnailBase64}`}
                    alt="Thumbnail preview"
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="grid-glow-dark aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-display text-sm font-semibold text-white/85">
                        Thumbnail
                      </p>
                      <p className="mt-1 text-[11.5px] text-white/40">
                        Captured automatically after recording
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <ProgressBar
                value={uploadState.progressPercent}
                label="Multipart upload"
                hint={uploadHint}
              />

              {uploadState.error ? (
                <div className="flex items-start gap-3 rounded-xl border border-ember-200 bg-ember-50 px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-ember-700">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4" />
                    <circle cx="12" cy="16" r="0.6" fill="currentColor" />
                  </svg>
                  <p className="text-[13px] text-ember-700">{uploadState.error}</p>
                </div>
              ) : null}

              {uploadState.status === "success" ? (
                <div className="flex items-center gap-3 rounded-xl border border-ember-200 bg-ember-50 px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-ember-700">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                  <p className="text-[13px] font-medium text-ember-700">
                    Upload complete — share link ready
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => void handleUpload()}
                  disabled={!recordedBlob || uploadState.status === "uploading" || uploadState.status === "completing"}
                  variant="primary"
                  className="col-span-2"
                  size="lg"
                >
                  {uploadState.status === "success"
                    ? "Upload complete"
                    : uploadState.status === "uploading" || uploadState.status === "completing"
                      ? "Uploading…"
                      : "Upload recording"}
                </Button>
                <Button
                  onClick={() => void handleUpload()}
                  disabled={!recordedBlob || uploadState.status !== "error"}
                  variant="ghost"
                  size="sm"
                >
                  Retry
                </Button>
                <Button
                  onClick={() => void cancelUpload()}
                  disabled={uploadState.status !== "uploading" && uploadState.status !== "completing"}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    useUploadStore.getState().reset();
                    recorder.reset();
                    setRecordedBlob(null);
                    setThumbnailBase64(null);
                  }}
                  className="col-span-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-ink-400 transition-colors hover:text-ember-700"
                >
                  Reset workspace
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <CameraBubble stream={recorder.cameraPreviewStream} />
    </div>
  );
};

interface CapabilityProps {
  label: string;
  value: string;
  ok: boolean;
  mono?: boolean;
}

const Capability = ({ label, value, ok, mono }: CapabilityProps): JSX.Element => (
  <div className="flex items-center justify-between gap-3 bg-white/85 px-5 py-4">
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink-400">{label}</p>
      <p className={`mt-1 text-[13px] text-ink-700 ${mono ? "font-mono text-[12px]" : "font-medium"}`}>
        {value}
      </p>
    </div>
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full ${
        ok ? "bg-ember-50 text-ember-700 ring-1 ring-ember-200" : "bg-ink-50 text-ink-400 ring-1 ring-ink/15"
      }`}
    >
      {ok ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5L20 7" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      )}
    </span>
  </div>
);

interface FormFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const FormField = ({ label, hint, children }: FormFieldProps): JSX.Element => (
  <label className="block space-y-1.5">
    <span className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
        {label}
      </span>
      {hint ? (
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-400 tabular-nums">{hint}</span>
      ) : null}
    </span>
    {children}
  </label>
);
