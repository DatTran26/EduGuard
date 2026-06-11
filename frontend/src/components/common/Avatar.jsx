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
          "flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#8fd3a7,#5ea873)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(94,168,115,0.28)]",
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
      className={cn("rounded-full object-cover shadow-[0_10px_24px_rgba(94,168,115,0.18)]", sizeClassName, className)}
      onError={() => setFailedImageUrl(resolvedAvatarUrl)}
      src={resolvedAvatarUrl}
    />
  );
}
