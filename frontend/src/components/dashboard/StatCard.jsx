import { cn } from "../../utils/cn";

const TONE_CLASS_NAMES = {
  neutral: "border-border bg-surface",
  info: "border-info/15 bg-info/5",
  success: "border-success/15 bg-success/5",
  caution: "border-caution/15 bg-caution/5",
};

// Component này là thẻ số liệu thống nhất cho dashboard để các role nhìn cùng một ngôn ngữ hiển thị.
export default function StatCard({
  label,
  value,
  helperText,
  tone = "neutral",
}) {
  return (
    <div className={cn("rounded-[20px] border p-5", TONE_CLASS_NAMES[tone] ?? TONE_CLASS_NAMES.neutral)}>
      <p className="text-[0.82rem] font-medium text-secondary">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">{value}</p>
      {helperText ? <p className="mt-3 text-sm leading-6 text-secondary">{helperText}</p> : null}
    </div>
  );
}
