import { create } from "zustand";

import type { RecordingType } from "@clipforge/shared/types";

import { getBestMimeType } from "./mediaSupport";

export type RecorderMode = RecordingType;
export type RecorderStatus = "idle" | "requesting" | "recording" | "paused" | "stopped" | "error";

interface RecorderStore {
  mode: RecorderMode;
  status: RecorderStatus;
  mimeType: string | null;
  durationMs: number;
  error: string | null;
  previewUrl: string | null;
  livePreviewStream: MediaStream | null;
  cameraPreviewStream: MediaStream | null;
  mediaRecorderRef: MediaRecorder | null;
  recordingStreamRef: MediaStream | null;
  displayStreamRef: MediaStream | null;
  cameraStreamRef: MediaStream | null;
  audioStreamRef: MediaStream | null;
  chunksRef: Blob[];
  timerRef: number | null;
  startedAtRef: number | null;
  pauseStartedAtRef: number | null;
  pausedAccumulatedMsRef: number;
  setMode: (mode: RecorderMode) => void;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<Blob | null>;
  cancel: () => Promise<void>;
  reset: () => void;
}

const stopStream = (stream: MediaStream | null): void => {
  stream?.getTracks().forEach((track) => track.stop());
};

const revokePreviewUrl = (url: string | null): void => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

const clearTimer = (timerRef: number | null): void => {
  if (timerRef !== null) {
    window.clearInterval(timerRef);
  }
};

const stopStreams = (...streams: Array<MediaStream | null>): void => {
  for (const stream of streams) {
    stopStream(stream);
  }
};

const toRecorderErrorMessage = (error: unknown, mode: RecorderMode): string => {
  const name = typeof error === "object" && error !== null && "name" in error ? String(error.name) : "";
  const message = error instanceof Error ? error.message : "Failed to start recording.";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Permission was denied. Allow screen, camera, or microphone access and try again.";
  }

  if (name === "NotFoundError" || message.includes("Requested device not found")) {
    if (mode === "camera") {
      return "No camera device was found. Connect a camera or switch to screen mode.";
    }

    if (mode === "screen_mic") {
      return "No microphone device was found. Connect a microphone or switch to screen mode.";
    }

    if (mode === "screen_camera_mic") {
      return "A camera or microphone device was not found. Connect both devices or switch to screen or screen_mic mode.";
    }
  }

  if (name === "NotReadableError") {
    return "Your camera, microphone, or screen is busy in another app. Close the other app and try again.";
  }

  if (name === "AbortError") {
    return "Recording setup was interrupted. Try starting the recording again.";
  }

  return message;
};

const buildRecordingContext = async (
  mode: RecorderMode
): Promise<{
  mimeType: string;
  recordingStream: MediaStream;
  displayStream: MediaStream | null;
  cameraStream: MediaStream | null;
  audioStream: MediaStream | null;
  livePreviewStream: MediaStream;
}> => {
  const mimeType = getBestMimeType();
  if (!mimeType) {
    throw new Error("This browser does not support recording with the required MIME types.");
  }

  let displayStream: MediaStream | null = null;
  let cameraStream: MediaStream | null = null;
  let audioStream: MediaStream | null = null;

  try {
    if (mode === "screen" || mode === "screen_mic" || mode === "screen_camera_mic") {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
    }

    if (mode === "camera" || mode === "screen_camera_mic") {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: mode === "camera"
      });
    }

    if (mode === "screen_mic" || mode === "screen_camera_mic") {
      audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
    }

    const tracks: MediaStreamTrack[] = [];

    if (mode === "camera") {
      tracks.push(...(cameraStream?.getVideoTracks() ?? []), ...(cameraStream?.getAudioTracks() ?? []));
    } else {
      tracks.push(...(displayStream?.getVideoTracks() ?? []), ...(audioStream?.getAudioTracks() ?? []));
    }

    if (tracks.length === 0) {
      throw new Error("No media tracks were available to record.");
    }

    const recordingStream = new MediaStream(tracks);
    const livePreviewStream = mode === "camera" ? recordingStream : displayStream ?? recordingStream;

    return {
      mimeType,
      recordingStream,
      displayStream,
      cameraStream,
      audioStream,
      livePreviewStream
    };
  } catch (error) {
    stopStreams(displayStream, cameraStream, audioStream);
    throw new Error(toRecorderErrorMessage(error, mode));
  }
};

export const useRecorderStore = create<RecorderStore>((set, get) => ({
  mode: "screen",
  status: "idle",
  mimeType: null,
  durationMs: 0,
  error: null,
  previewUrl: null,
  livePreviewStream: null,
  cameraPreviewStream: null,
  mediaRecorderRef: null,
  recordingStreamRef: null,
  displayStreamRef: null,
  cameraStreamRef: null,
  audioStreamRef: null,
  chunksRef: [],
  timerRef: null,
  startedAtRef: null,
  pauseStartedAtRef: null,
  pausedAccumulatedMsRef: 0,
  setMode: (mode) => set({ mode }),
  start: async () => {
    const state = get();
    state.reset();
    set({ status: "requesting", error: null });

    try {
      const context = await buildRecordingContext(get().mode);
      const recorder = new MediaRecorder(context.recordingStream, {
        mimeType: context.mimeType
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          get().chunksRef.push(event.data);
        }
      };

      recorder.onerror = () => {
        set({ status: "error", error: "The browser recorder encountered an unexpected error." });
      };

      recorder.onstop = () => {
        const nextState = get();
        const blob =
          nextState.chunksRef.length > 0
            ? new Blob(nextState.chunksRef, {
                type: nextState.mimeType ?? context.mimeType
              })
            : null;

        revokePreviewUrl(nextState.previewUrl);
        clearTimer(nextState.timerRef);

        set({
          status: nextState.status === "error" ? "error" : "stopped",
          previewUrl: blob ? URL.createObjectURL(blob) : null,
          durationMs:
            nextState.startedAtRef !== null
              ? Date.now() - nextState.startedAtRef - nextState.pausedAccumulatedMsRef
              : nextState.durationMs,
          livePreviewStream: null
        });

        stopStream(nextState.recordingStreamRef);
        stopStream(nextState.displayStreamRef);
        stopStream(nextState.cameraStreamRef);
        stopStream(nextState.audioStreamRef);
      };

      context.displayStream?.getVideoTracks()[0]?.addEventListener("ended", () => {
        const current = get();
        if (current.status === "recording" || current.status === "paused") {
          void current.stop();
        }
      });

      recorder.start(1000);
      const startedAt = Date.now();
      const timerId = window.setInterval(() => {
        const snapshot = get();
        if (snapshot.startedAtRef === null) {
          return;
        }

        const pauseOffset =
          snapshot.pauseStartedAtRef !== null
            ? Date.now() - snapshot.pauseStartedAtRef
            : 0;

        set({
          durationMs: Date.now() - snapshot.startedAtRef - snapshot.pausedAccumulatedMsRef - pauseOffset
        });
      }, 250);

      set({
        status: "recording",
        mimeType: context.mimeType,
        mediaRecorderRef: recorder,
        recordingStreamRef: context.recordingStream,
        displayStreamRef: context.displayStream,
        cameraStreamRef: context.cameraStream,
        audioStreamRef: context.audioStream,
        livePreviewStream: context.livePreviewStream,
        cameraPreviewStream: context.cameraStream,
        chunksRef: [],
        startedAtRef: startedAt,
        pauseStartedAtRef: null,
        pausedAccumulatedMsRef: 0,
        durationMs: 0,
        timerRef: timerId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start recording.";
      set({
        status: "error",
        error: message
      });
    }
  },
  pause: () => {
    const state = get();
    if (state.mediaRecorderRef?.state === "recording") {
      state.mediaRecorderRef.pause();
      set({
        status: "paused",
        pauseStartedAtRef: Date.now()
      });
    }
  },
  resume: () => {
    const state = get();
    if (state.mediaRecorderRef?.state === "paused") {
      const pausedAccumulatedMsRef =
        state.pausedAccumulatedMsRef +
        (state.pauseStartedAtRef ? Date.now() - state.pauseStartedAtRef : 0);

      state.mediaRecorderRef.resume();
      set({
        status: "recording",
        pauseStartedAtRef: null,
        pausedAccumulatedMsRef
      });
    }
  },
  stop: async () => {
    const state = get();
    const activeRecorder = state.mediaRecorderRef;

    if (!activeRecorder || activeRecorder.state === "inactive") {
      return state.previewUrl ? await fetch(state.previewUrl).then((response) => response.blob()) : null;
    }

    const finished = new Promise<Blob | null>((resolve) => {
      const recorder = activeRecorder;
      const handleStop = () => {
        recorder.removeEventListener("stop", handleStop);
        const nextState = get();
        resolve(
          nextState.previewUrl
            ? fetch(nextState.previewUrl).then((response) => response.blob())
            : Promise.resolve(null)
        );
      };

      recorder.addEventListener("stop", handleStop);
    });

    activeRecorder.stop();
    return finished;
  },
  cancel: async () => {
    const state = get();
    clearTimer(state.timerRef);

    if (state.mediaRecorderRef && state.mediaRecorderRef.state !== "inactive") {
      state.mediaRecorderRef.stop();
    } else {
      stopStream(state.recordingStreamRef);
      stopStream(state.displayStreamRef);
      stopStream(state.cameraStreamRef);
      stopStream(state.audioStreamRef);
    }

    revokePreviewUrl(state.previewUrl);
    set({
      status: "idle",
      error: null,
      previewUrl: null,
      livePreviewStream: null,
      cameraPreviewStream: null,
      mediaRecorderRef: null,
      recordingStreamRef: null,
      displayStreamRef: null,
      cameraStreamRef: null,
      audioStreamRef: null,
      chunksRef: [],
      timerRef: null,
      startedAtRef: null,
      pauseStartedAtRef: null,
      pausedAccumulatedMsRef: 0,
      durationMs: 0
    });
  },
  reset: () => {
    const state = get();
    clearTimer(state.timerRef);
    stopStream(state.recordingStreamRef);
    stopStream(state.displayStreamRef);
    stopStream(state.cameraStreamRef);
    stopStream(state.audioStreamRef);
    revokePreviewUrl(state.previewUrl);

    set({
      status: "idle",
      mimeType: null,
      durationMs: 0,
      error: null,
      previewUrl: null,
      livePreviewStream: null,
      cameraPreviewStream: null,
      mediaRecorderRef: null,
      recordingStreamRef: null,
      displayStreamRef: null,
      cameraStreamRef: null,
      audioStreamRef: null,
      chunksRef: [],
      timerRef: null,
      startedAtRef: null,
      pauseStartedAtRef: null,
      pausedAccumulatedMsRef: 0
    });
  }
}));
