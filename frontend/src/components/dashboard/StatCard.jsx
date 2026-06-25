import { cn } from "../../utils/cn";

const TONE_CLASS_NAMES = {
  neutral: "",
  info: "border-info/20 bg-info-muted",
  success: "border-success/20 bg-success-muted",
  caution: "border-caution/20 bg-caution-muted",
  danger: "border-danger/20 bg-danger-muted",
};

const TONE_ICON_CLASS_NAMES = {
  neutral: "text-secondary",
  info: "text-info",
  success: "text-success",
  caution: "text-caution",
  danger: "text-danger",
};

// Component này là thẻ số liệu thống nhất cho dashboard để các role nhìn cùng một ngôn ngữ hiển thị.
export default function StatCard({
  label,
  value,
  tone = "neutral",
  icon,
}) {
  return (
    <div className={cn("eg-summary-card", TONE_CLASS_NAMES[tone] ?? TONE_CLASS_NAMES.neutral)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.82rem] font-medium text-secondary">{label}</p>
        {icon && (
          <span className={cn("shrink-0", TONE_ICON_CLASS_NAMES[tone] ?? TONE_ICON_CLASS_NAMES.neutral)}>
            {icon}
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold tracking-tight text-primary">{value}</p>
    </div>
  );
}
