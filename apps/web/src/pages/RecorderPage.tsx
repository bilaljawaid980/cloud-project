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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-dusk">Recorder</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Capture once, ship instantly</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={supported ? "ready" : "failed"} />
          {env.devMode ? <StatusBadge tone="private" /> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-soft">
            <div className="flex flex-wrap gap-3">
              {(["screen", "screen_mic", "screen_camera_mic", "camera"] satisfies RecorderMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    recorder.mode === mode
                      ? "bg-ink text-white"
                      : "bg-white text-dusk ring-1 ring-ink/10 hover:text-ink"
                  }`}
                  onClick={() => recorder.setMode(mode)}
                  type="button"
                >
                  {mode.replaceAll("_", " ")}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 text-sm text-dusk sm:grid-cols-3">
              <div className="rounded-2xl bg-white/70 p-4">Display capture: {String(capabilities.hasDisplayCapture)}</div>
              <div className="rounded-2xl bg-white/70 p-4">Camera/mic: {String(capabilities.hasUserMedia)}</div>
              <div className="rounded-2xl bg-white/70 p-4">Recorder MIME: {capabilities.mimeType ?? "unsupported"}</div>
            </div>

            <p className="mt-5 text-sm text-dusk">
              Grant screen, camera, and microphone permissions when prompted. In
              <span className="font-semibold text-ink"> screen_camera_mic </span>
              mode the camera bubble is a live overlay preview only for MVP. True compositing can land post-MVP.
            </p>
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

          {recorder.error ? <p className="text-sm text-rose-600">{recorder.error}</p> : null}
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-soft">
            <h2 className="font-display text-3xl text-ink">Clip Details</h2>
            <div className="mt-5 space-y-4">
              <label className="block space-y-2 text-sm text-dusk">
                <span>Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-ember"
                  maxLength={200}
                />
              </label>
              <label className="block space-y-2 text-sm text-dusk">
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="h-28 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-ember"
                  maxLength={2000}
                />
              </label>
              <label className="block space-y-2 text-sm text-dusk">
                <span>Visibility</span>
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as VideoVisibility)}
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-ember"
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
              </label>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-ink">Upload</h2>
              <StatusBadge tone={uploadStatusTone} />
            </div>

            <div className="mt-5 space-y-4">
              {thumbnailBase64 ? (
                <img
                  src={`data:image/jpeg;base64,${thumbnailBase64}`}
                  alt="Thumbnail preview"
                  className="aspect-video w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="grid-glow aspect-video rounded-2xl border border-dashed border-ink/10" />
              )}

              <ProgressBar value={uploadState.progressPercent} label="Multipart upload progress" />

              {uploadState.error ? <p className="text-sm text-rose-600">{uploadState.error}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => void handleUpload()}
                  disabled={!recordedBlob || uploadState.status === "uploading" || uploadState.status === "completing"}
                  variant="secondary"
                >
                  {uploadState.status === "success" ? "Upload Complete" : "Upload Recording"}
                </Button>
                <Button
                  onClick={() => void handleUpload()}
                  disabled={!recordedBlob || uploadState.status !== "error"}
                  variant="ghost"
                >
                  Retry Upload
                </Button>
                <Button
                  onClick={() => void cancelUpload()}
                  disabled={uploadState.status !== "uploading" && uploadState.status !== "completing"}
                  variant="ghost"
                >
                  Cancel Upload
                </Button>
                <Button
                  onClick={() => {
                    useUploadStore.getState().reset();
                    recorder.reset();
                    setRecordedBlob(null);
                    setThumbnailBase64(null);
                  }}
                  variant="ghost"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CameraBubble stream={recorder.cameraPreviewStream} />
    </div>
  );
};
