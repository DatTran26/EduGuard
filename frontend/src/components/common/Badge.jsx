import { cn } from "../../utils/cn";

const BADGE_VARIANT_CLASS_NAMES = {
  neutral: "eg-badge eg-badge-neutral",
  success: "eg-badge eg-badge-success",
  caution: "eg-badge eg-badge-caution",
  danger: "eg-badge eg-badge-danger",
  info: "eg-badge eg-badge-info",
};

// Component này dùng để hiển thị trạng thái ngắn gọn như role, cảnh báo hoặc mức độ ưu tiên.
export default function Badge({ variant = "neutral", className, children }) {
  const variantClassName =
    BADGE_VARIANT_CLASS_NAMES[variant] ?? BADGE_VARIANT_CLASS_NAMES.neutral;

  return <span className={cn(variantClassName, className)}>{children}</span>;
}
