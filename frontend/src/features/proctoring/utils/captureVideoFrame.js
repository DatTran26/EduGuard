export async function captureVideoFrame(videoEl, mimeType = "image/jpeg", quality = 0.92) {
  if (!videoEl || !videoEl.videoWidth) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext("2d")?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
  if (!blob) {
    return null;
  }

  return new File([blob], `frame-${Date.now()}.jpg`, { type: mimeType });
}
