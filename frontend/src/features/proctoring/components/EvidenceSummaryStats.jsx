import { FiCamera, FiFilm, FiSearch, FiShield } from "react-icons/fi";
import { cn } from "../../../utils/cn";

const STAT_ITEMS = [
  {
    key: "total",
    label: "Tổng bằng chứng",
    tone: "brand",
    icon: FiShield,
    getValue: (summary) => summary.totalCount,
    showShare: false,
  },
  {
    key: "snapshot",
    label: "Ảnh chụp",
    tone: "info",
    icon: FiCamera,
    getValue: (summary) => summary.snapshotCount,
    showShare: true,
  },
  {
    key: "clip",
    label: "Video clip",
    tone: "danger",
    icon: FiFilm,
    getValue: (summary) => summary.clipCount,
    showShare: true,
  },
  {
    key: "auto",
    label: "Tự động / AI",
    tone: "caution",
    icon: FiSearch,
    getValue: (summary) => summary.autoCount,
    showShare: true,
  },
];

const TONE_CARD_CLASS = {
  brand: "",
  info: "eg-exam-summary-card-info",
  danger: "eg-exam-summary-card-danger",
  caution: "eg-exam-summary-card-caution",
};

const TONE_ICON_CLASS = {
  brand: "text-brand",
  info: "text-info",
  danger: "text-danger",
  caution: "text-caution",
};

function formatShare(value, total) {
  if (!total || total <= 0) {
    return null;
  }

  const percent = Math.round((value / total) * 100);
  return `${percent}% tổng`;
}

function EvidenceStatCard({ label, value, tone, icon: Icon, shareLabel }) {
  return (
    <article
      className={cn(
        "eg-exam-summary-card transition-shadow duration-200 hover:shadow-[0_8px_24px_rgb(15_23_42_/_8%)]",
        TONE_CARD_CLASS[tone],
      )}
    >
      <span aria-hidden="true" className="eg-exam-summary-card-bar" />
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-secondary">
            {label}
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-primary">{value}</p>
          {shareLabel ? (
            <p className="text-xs font-medium text-secondary">{shareLabel}</p>
          ) : (
            <p className="text-xs font-medium text-secondary">Toàn bộ kho lưu trữ</p>
          )}
        </div>
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/70 bg-white/75 shadow-sm"
        >
          <Icon className={cn("h-5 w-5", TONE_ICON_CLASS[tone])} />
        </span>
      </div>
    </article>
  );
}

export default function EvidenceSummaryStats({ summary }) {
  const total = summary.totalCount ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_ITEMS.map((item) => {
        const value = item.getValue(summary) ?? 0;
        const shareLabel = item.showShare ? formatShare(value, total) : null;

        return (
          <EvidenceStatCard
            key={item.key}
            icon={item.icon}
            label={item.label}
            shareLabel={shareLabel}
            tone={item.tone}
            value={value}
          />
        );
      })}
    </div>
  );
}
