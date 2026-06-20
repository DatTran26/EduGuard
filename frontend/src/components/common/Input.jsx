import { forwardRef } from "react";
import { cn } from "../../utils/cn";

// Hàm này chọn class phù hợp cho input hoặc textarea để mình không phải lặp style ở nhiều nơi.
function getInputClassName(as, className) {
  if (as === "textarea") {
    return cn("eg-input min-h-32 resize-y", className);
  }

  return cn("eg-input", className);
}

// Component này là input dùng chung cho form, có hỗ trợ cả textarea khi cần nhập mô tả dài.
const Input = forwardRef(function Input({ as = "input", className, ...props }, ref) {
  const ComponentTag = as === "textarea" ? "textarea" : "input";

  return <ComponentTag ref={ref} className={getInputClassName(as, className)} {...props} />;
});

export default Input;
