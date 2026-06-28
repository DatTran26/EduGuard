import { useCallback, useLayoutEffect, useRef } from "react";
import { FiVideo } from "react-icons/fi";
import Badge from "../../../components/common/Badge";
import { cn } from "../../../utils/cn";

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

const COMPACT_SHELL = {
  ready: {
    shell:
      "border-emerald-200/90 bg-white/90 shadow-[0_10px_30px_-18px_rgba(16,185,129,0.22)]",
    label:
      "border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800",
    icon: "text-emerald-600",
    frame: "ring-emerald-500/15",
  },
  warning: {
    shell:
      "border-amber-200/90 bg-amber-50/40 shadow-[0_10px_30px_-18px_rgba(217,119,6,0.18)]",
    label:
      "border-amber-200/90 bg-gradient-to-r from-amber-50 to-amber-100/90 text-amber-800",
    icon: "text-amber-600",
    frame: "ring-amber-500/15",
  },
  danger: {
    shell:
      "border-rose-200/90 bg-rose-50/45 shadow-[0_10px_30px_-18px_rgba(225,29,72,0.2)]",
    label:
      "border-rose-200/90 bg-gradient-to-r from-rose-50 to-rose-100/90 text-rose-800",
    icon: "text-rose-600",
    frame: "ring-rose-500/15",
  },
  neutral: {
    shell:
      "border-slate-200/90 bg-white/90 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.16)]",
    label:
      "border-slate-200/80 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600",
    icon: "text-slate-500",
    frame: "ring-slate-400/10",
  },
};

function getCompactTone(status) {
  if (status === "ready") {
    return "ready";
  }

  if (status === "denied" || status === "off" || status === "error") {
    return "danger";
  }

  if (status === "requesting") {
    return "warning";
  }

  return "neutral";
}

function getBadgeTone(status) {
  if (status === "ready") {
    return "success";
  }

  if (status === "denied" || status === "off" || status === "error") {
    return "danger";
  }

  return "neutral";
}

function LiveBadge({ compact = false }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-black/70 backdrop-blur-sm",
        compact ? "px-1 py-px" : "px-1.5 py-0.5",
      )}
    >
      <span className="relative flex shrink-0">
        <span
          className={cn(
            "absolute inline-flex animate-ping rounded-full bg-rose-400/70 opacity-75",
            compact ? "h-1.5 w-1.5" : "h-2 w-2",
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full bg-rose-500",
            compact ? "h-1.5 w-1.5" : "h-2 w-2",
          )}
        />
      </span>
      <span
        className={cn(
          "font-bold uppercase tracking-[0.12em] text-white",
          compact ? "text-[0.5rem]" : "text-[0.62rem]",
        )}
      >
        Live
      </span>
    </div>
  );
}

function CompactCameraShell({
  attachVideoElement,
  errorMessage,
  label,
  status,
  styles,
  header = false,
}) {
  const isLive = status === "ready";

  if (header) {
    return (
      <div
        aria-label={`${label}: ${STATUS_LABELS[status] ?? status}`}
        className={cn("relative rounded-xl border px-2 pb-1.5 pt-2", styles.shell)}
        title={STATUS_LABELS[status] ?? status}
      >
        {isLive ? (
          <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
            <LiveBadge compact />
          </div>
        ) : null}

        <div
          className={cn(
            "relative mx-auto h-8 w-[4.25rem] shrink-0 overflow-hidden rounded-md bg-slate-950 ring-1 ring-inset",
            styles.frame,
          )}
        >
          <video
            ref={attachVideoElement}
            autoPlay
            className="absolute inset-0 h-full w-full object-cover mirror-video"
            muted
            playsInline
          />

          {!isLive ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 px-1">
              <FiVideo aria-hidden="true" className="h-3 w-3 text-slate-400" />
            </div>
          ) : null}
        </div>

        <p className="mt-1 truncate text-center text-[0.58rem] font-medium leading-none text-secondary">
          {isLive ? label : errorMessage || STATUS_LABELS[status] || status}
        </p>
      </div>
    );
  }

  return (
    <div
      aria-label={`${label}: ${STATUS_LABELS[status] ?? status}`}
      className={cn(
        "flex w-[156px] flex-col rounded-2xl border px-3 py-2.5 sm:w-[176px] sm:px-3.5 sm:py-3",
        styles.shell,
      )}
    >
      <div
        className={cn(
          "mb-2 inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-1 shadow-sm",
          styles.label,
        )}
      >
        <FiVideo aria-hidden="true" className={cn("h-3.5 w-3.5 shrink-0", styles.icon)} />
        <span className="text-[0.68rem] font-semibold leading-none tracking-[0.02em]">
          {label}
        </span>
      </div>

      <div
        className={cn(
          "relative rounded-xl bg-slate-950 pt-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-inset",
          styles.frame,
        )}
      >
        {isLive ? (
          <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
            <LiveBadge />
          </div>
        ) : null}

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <video
            ref={attachVideoElement}
            autoPlay
            className="absolute inset-0 h-full w-full object-cover mirror-video"
            muted
            playsInline
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
          />

          {isLive ? (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/45 to-transparent"
              />
              <div className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-md border border-emerald-400/20 bg-emerald-500/15 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-emerald-100 backdrop-blur-sm">
                Giám sát
              </div>
            </>
          ) : (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/78 px-3 text-center backdrop-blur-[1px]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <FiVideo aria-hidden="true" className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-[0.68rem] font-medium leading-4 text-slate-200">
                {errorMessage ||
                  (status === "off" ? "Camera đang tắt" : "Đang chuẩn bị camera…")}
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 truncate text-center text-[0.68rem] font-medium text-secondary">
        {STATUS_LABELS[status] ?? status}
      </p>
    </div>
  );
}

function StandardCameraShell({
  attachVideoElement,
  errorMessage,
  label,
  status,
  tone,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">{label}</p>
        <Badge variant={tone}>{STATUS_LABELS[status] ?? status}</Badge>
      </div>

      <div className="relative rounded-[18px] border border-border bg-slate-950 pt-2 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/5">
        {status === "ready" ? (
          <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
            <LiveBadge />
          </div>
        ) : null}

        <div className="relative aspect-video w-full overflow-hidden rounded-[16px]">
          <video
            ref={attachVideoElement}
            autoPlay
            className="absolute inset-0 h-full w-full object-cover mirror-video"
            muted
            playsInline
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 rounded-[14px] border border-white/10"
          />

          {status === "ready" ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent"
            />
          ) : (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/85 px-4 text-center text-sm text-secondary backdrop-blur-[2px]">
              {errorMessage ||
                (status === "off" ? "Camera đang tắt" : "Đang chuẩn bị camera…")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CameraPreview({
  videoRef,
  setVideoElement,
  mediaStream = null,
  status = "idle",
  errorMessage = "",
  className = "",
  label = "Camera",
  compact = false,
  header = false,
}) {
  const localVideoRef = useRef(null);
  const tone = getBadgeTone(status);
  const compactStyles = COMPACT_SHELL[getCompactTone(status)];

  const attachVideoElement = useCallback(
    (node) => {
      localVideoRef.current = node;

      if (videoRef) {
        videoRef.current = node;
      }

      setVideoElement?.(node);
    },
    [setVideoElement, videoRef],
  );

  useLayoutEffect(() => {
    const video = localVideoRef.current;
    if (!video || !mediaStream) {
      if (video && !mediaStream) {
        video.srcObject = null;
      }
      return;
    }

    if (video.srcObject !== mediaStream) {
      video.srcObject = mediaStream;
      void video.play().catch(() => {});
    }
  }, [mediaStream]);

  if (compact) {
    return (
      <div className={className}>
        <CompactCameraShell
          attachVideoElement={attachVideoElement}
          errorMessage={errorMessage}
          header={header}
          label={label}
          status={status}
          styles={compactStyles}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <StandardCameraShell
        attachVideoElement={attachVideoElement}
        errorMessage={errorMessage}
        label={label}
        status={status}
        tone={tone}
      />
    </div>
  );
}
