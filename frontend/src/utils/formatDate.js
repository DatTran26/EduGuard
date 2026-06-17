const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const UTCLESS_ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,7})?)?$/;

function normalizeDateInput(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || !UTCLESS_ISO_DATE_TIME_PATTERN.test(trimmedValue)) {
    return trimmedValue;
  }

  return `${trimmedValue}Z`;
}

export function parseDateValue(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const dateObject = new Date(normalizeDateInput(value));
  return Number.isNaN(dateObject.getTime()) ? null : dateObject;
}

// Hàm này format ngày ngắn theo chuẩn tiếng Việt mà tài liệu đang yêu cầu.
export function formatShortDate(value) {
  const dateObject = parseDateValue(value);

  if (!dateObject) {
    return "--/--/----";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObject);
}

// Hàm này format ngày giờ theo kiểu dd/MM/yyyy HH:mm để hiển thị trên giao diện.
export function formatShortDateTime(value) {
  const dateObject = parseDateValue(value);

  if (!dateObject) {
    return "--/--/---- --:--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dateObject);
}
