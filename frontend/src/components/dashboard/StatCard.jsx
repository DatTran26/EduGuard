import { cn } from "../../utils/cn";

const TONE_CLASS_NAMES = {
  neutral: "",
  info: "border-info/20 bg-info-muted",
  success: "border-success/20 bg-success-muted",
  caution: "border-caution/20 bg-caution-muted",
};

// Component này là thẻ số liệu thống nhất cho dashboard để các role nhìn cùng một ngôn ngữ hiển thị.
export default function StatCard({
  label,
  value,
  tone = "neutral",
}) {
  return (
    <div className={cn("eg-summary-card", TONE_CLASS_NAMES[tone] ?? TONE_CLASS_NAMES.neutral)}>
      <p className="text-[0.82rem] font-medium text-secondary">{label}</p>
      <p className="text-3xl font-semibold tracking-tight text-primary">{value}</p>
    </div>
  );
}
