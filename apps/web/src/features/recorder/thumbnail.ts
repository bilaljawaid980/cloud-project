const canvasToBase64 = async (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number
): Promise<string | null> => {
  if (canvas instanceof HTMLCanvasElement) {
    return canvas.toDataURL("image/jpeg", quality).split(",")[1] ?? null;
  }

  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality
  });

  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
};

export const captureVideoThumbnail = async (
  videoEl: HTMLVideoElement,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.85
): Promise<string | null> => {
  try {
    if (!videoEl.videoWidth || !videoEl.videoHeight) {
      return null;
    }

    const scale = Math.min(maxWidth / videoEl.videoWidth, maxHeight / videoEl.videoHeight, 1);
    const width = Math.max(1, Math.floor(videoEl.videoWidth * scale));
    const height = Math.max(1, Math.floor(videoEl.videoHeight * scale));

    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d");
      if (!context) {
        return null;
      }

      context.drawImage(videoEl, 0, 0, width, height);
      return canvasToBase64(canvas, quality);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.drawImage(videoEl, 0, 0, width, height);
    return canvasToBase64(canvas, quality);
  } catch {
    return null;
  }
};
