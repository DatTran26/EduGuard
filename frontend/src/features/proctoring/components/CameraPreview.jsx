import Badge from "../../../components/common/Badge";

const STATUS_LABELS = {
  idle: "Chưa bật",
  requesting: "Đang xin quyền…",
  ready: "Đã sẵn sàng",
  denied: "Chưa cấp quyền",
  "not-found": "Không có camera",
  off: "Camera tắt",
  error: "Lỗi camera",
  unsupported: "Không hỗ trợ",
};

export default function CameraPreview({
  videoRef,
  status = "idle",
  errorMessage = "",
  className = "",
  label = "Camera",
}) {
  const tone =
    status === "ready"
      ? "success"
      : status === "denied" || status === "off" || status === "error"
        ? "danger"
        : "neutral";

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">{label}</p>
        <Badge variant={tone}>{STATUS_LABELS[status] ?? status}</Badge>
      </div>

      <div className="relative overflow-hidden rounded-[16px] border border-border bg-surface-sunken aspect-video">
        <video
          ref={videoRef}
          autoPlay
          className="h-full w-full object-cover mirror-video"
          muted
          playsInline
        />
        {status !== "ready" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 px-4 text-center text-sm text-secondary">
            {errorMessage ||
              (status === "off" ? "Camera đang tắt" : "Đang chuẩn bị camera…")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
