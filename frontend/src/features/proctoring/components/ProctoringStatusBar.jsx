import { cn } from "../../../utils/cn";

const METRIC_TONES = {
  neutral: "border-white/10 bg-white/[0.03] text-slate-300",
  info: "border-sky-400/25 bg-sky-500/10 text-sky-200",
  success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  caution: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  danger: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

export default function ProctoringStatusBar({ stats }) {
  const items = [
    { label: "Đang làm", value: stats.inProgress, tone: "info" },
    { label: "Live", value: stats.live, tone: "info" },
    { label: "Tạm dừng", value: stats.paused, tone: "caution" },
    { label: "Đã nộp", value: stats.submitted, tone: "success" },
    { label: "Camera lỗi", value: stats.cameraError, tone: stats.cameraError ? "danger" : "neutral" },
    { label: "Mất kết nối", value: stats.disconnected, tone: stats.disconnected ? "danger" : "neutral" },
    { label: "Rủi ro cao", value: stats.highRisk, tone: stats.highRisk ? "caution" : "neutral" },
    { label: "Critical", value: stats.critical, tone: stats.critical ? "danger" : "neutral" },
    { label: "Thiết bị ngoài", value: stats.external, tone: stats.external ? "caution" : "neutral" },
    { label: "Slot live", value: stats.slots, tone: "neutral" },
  ];

  return (
    <section
      aria-label="Tổng quan trạng thái phòng giám sát"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-[12px] border px-3 py-2.5 transition-colors",
            METRIC_TONES[item.tone] ?? METRIC_TONES.neutral,
          )}
        >
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.1em] opacity-80">{item.label}</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-white">{item.value}</p>
        </div>
      ))}
    </section>
  );
}
