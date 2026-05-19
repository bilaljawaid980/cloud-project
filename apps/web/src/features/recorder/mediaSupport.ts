import { VIDEO_MIME_PREFERENCE } from "@clipforge/shared/constants";

export const getBestMimeType = (): string | null => {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  for (const mimeType of VIDEO_MIME_PREFERENCE) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
};

export const isRecordingSupported = (): boolean =>
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices?.getUserMedia === "function" &&
  typeof navigator.mediaDevices?.getDisplayMedia === "function" &&
  typeof MediaRecorder !== "undefined" &&
  Boolean(getBestMimeType());

export const getCapabilities = () => ({
  hasDisplayCapture: typeof navigator.mediaDevices?.getDisplayMedia === "function",
  hasUserMedia: typeof navigator.mediaDevices?.getUserMedia === "function",
  hasMediaRecorder: typeof MediaRecorder !== "undefined",
  mimeType: getBestMimeType()
});
