export async function ensureFullscreenExited() {
  if (typeof document === "undefined") {
    return true;
  }

  if (!document.fullscreenElement) {
    return true;
  }

  if (typeof document.exitFullscreen !== "function") {
    return false;
  }

  try {
    await document.exitFullscreen();
  } catch {
    return !document.fullscreenElement;
  }

  return !document.fullscreenElement;
}
