import { useState } from "react";
import { cn } from "../../utils/cn";
import { getAvatarInitials, getAvatarUrl } from "../../utils/avatar";

// Component này hiển thị avatar người dùng và tự fallback về chữ cái đầu nếu ảnh bị lỗi.
export default function Avatar({
  alt = "Ảnh đại diện",
  className,
  name = "",
  sizeClassName = "h-12 w-12",
  src = "",
}) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const resolvedAvatarUrl = getAvatarUrl(src);
  const hasImageError = failedImageUrl === resolvedAvatarUrl;

  if (hasImageError) {
    return (
      <div
        aria-label={alt}
        className={cn(
          "flex items-center justify-center rounded-full border border-border bg-surface-sunken text-sm font-semibold text-primary",
          sizeClassName,
          className,
        )}
      >
        {getAvatarInitials(name)}
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={cn("rounded-full object-cover", sizeClassName, className)}
      onError={() => setFailedImageUrl(resolvedAvatarUrl)}
      src={resolvedAvatarUrl}
    />
  );
}
