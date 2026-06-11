// Hàm này format ngày ngắn theo chuẩn tiếng Việt mà tài liệu đang yêu cầu.
export function formatShortDate(value) {
  if (!value) {
    return "--/--/----";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

// Hàm này format ngày giờ theo kiểu dd/MM/yyyy HH:mm để hiển thị trên giao diện.
export function formatShortDateTime(value) {
  if (!value) {
    return "--/--/---- --:--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
