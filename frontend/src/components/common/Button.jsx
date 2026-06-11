import { cn } from "../../utils/cn";

const BUTTON_VARIANT_CLASS_NAMES = {
  primary: "eg-button eg-button-primary",
  secondary: "eg-button eg-button-secondary",
  ghost: "eg-button eg-button-ghost",
  danger: "eg-button eg-button-danger",
};

// Component này là nút bấm dùng chung để sau này toàn bộ app giữ đúng một style thống nhất.
export default function Button({
  type = "button",
  variant = "primary",
  className,
  children,
  ...props
}) {
  const variantClassName =
    BUTTON_VARIANT_CLASS_NAMES[variant] ?? BUTTON_VARIANT_CLASS_NAMES.primary;

  return (
    <button type={type} className={cn(variantClassName, className)} {...props}>
      {children}
    </button>
  );
}
