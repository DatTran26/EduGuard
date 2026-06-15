export const DEFAULT_CAPYBARA_AVATAR_URL = "/capybara-avatar.svg";
export const MOCK_GOOGLE_AVATAR_URL = "/google-student-avatar.svg";

// Hàm này trả avatar cuối cùng để UI luôn có ảnh hiển thị, kể cả khi user chưa nhập gì.
export function getAvatarUrl(avatarUrl) {
  return avatarUrl?.trim() || DEFAULT_CAPYBARA_AVATAR_URL;
}

// Hàm này dựng chữ cái đầu từ tên người dùng để fallback khi ảnh bị lỗi vẫn còn dấu nhận diện.
export function getAvatarInitials(fullName = "") {
  const nameParts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (nameParts.length === 0) {
    return "EG";
  }

  return nameParts.map((namePart) => namePart[0]?.toUpperCase() ?? "").join("");
}

// Hàm này dựng profile Google demo để mô phỏng flow OAuth trong lúc chưa có backend thật.
export function buildMockGoogleProfile() {
  return {
    fullName: "Nguyễn Google Mai",
    email: "student.google@eduguard.local",
    avatarUrl: MOCK_GOOGLE_AVATAR_URL,
  };
}
