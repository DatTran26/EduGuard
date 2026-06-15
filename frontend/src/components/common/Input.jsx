import { cn } from "../../utils/cn";

// Hàm này chọn class phù hợp cho input hoặc textarea để mình không phải lặp style ở nhiều nơi.
function getInputClassName(as, className) {
  if (as === "textarea") {
    return cn("eg-input min-h-32 resize-y", className);
  }

  return cn("eg-input", className);
}

// Component này là input dùng chung cho form, có hỗ trợ cả textarea khi cần nhập mô tả dài.
export default function Input({ as = "input", className, ...props }) {
  const ComponentTag = as === "textarea" ? "textarea" : "input";

  return <ComponentTag className={getInputClassName(as, className)} {...props} />;
}
