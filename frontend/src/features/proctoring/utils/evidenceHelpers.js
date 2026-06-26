export const EVIDENCE_TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại" },
  { value: "Snapshot", label: "Ảnh chụp thủ công" },
  { value: "Clip", label: "Video clip" },
  { value: "AutoSnapshot", label: "Ảnh tự động" },
  { value: "AutoDetect", label: "AI phát hiện" },
];

export function getEvidenceTypeMeta(evidenceType) {
  switch (evidenceType) {
    case "Clip":
      return { label: "Video clip", tone: "danger", isVideo: true };
    case "AutoSnapshot":
      return { label: "Ảnh tự động", tone: "caution", isVideo: false };
    case "AutoDetect":
      return { label: "AI phát hiện", tone: "danger", isVideo: false };
    case "Snapshot":
    default:
      return { label: "Ảnh chụp", tone: "info", isVideo: false };
  }
}

export function getCaptureSourceLabel(source) {
  switch (source) {
    case "TeacherManual":
      return "Giáo viên";
    case "AutoPolicy":
      return "Chính sách tự động";
    case "StudentAuto":
      return "Sinh viên (AI)";
    default:
      return source || "Không rõ";
  }
}

export function isVideoEvidence(evidenceType, fileUrl) {
  const source = `${fileUrl ?? ""} ${evidenceType ?? ""}`;
  return /\.(webm|mp4)$/i.test(source) || /clip|video/i.test(source);
}
