// Hàm này dùng để ghép nhiều className lại với nhau cho gọn và dễ đọc hơn.
export function cn(...values) {
  return values.filter(Boolean).join(" ");
}
