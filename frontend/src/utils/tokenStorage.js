const ACCESS_TOKEN_KEY = "eduguard_access_token";
const REFRESH_TOKEN_KEY = "eduguard_refresh_token";
const USER_KEY = "eduguard_user";

// Hàm này đọc dữ liệu từ localStorage nhưng vẫn tránh app bị lỗi nếu trình duyệt chặn storage.
function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Hàm này ghi dữ liệu xuống localStorage theo kiểu an toàn.
function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Đoạn này mình để trống vì ở bước skeleton chỉ cần app không bị văng lỗi.
  }
}

// Hàm này xóa dữ liệu khỏi localStorage theo kiểu an toàn.
function safeRemoveItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Đoạn này mình để trống vì app chỉ cần bỏ qua nếu storage đang bị khóa.
  }
}

// Hàm này lấy access token đang lưu trong máy.
export function getStoredAccessToken() {
  return safeGetItem(ACCESS_TOKEN_KEY) ?? "";
}

// Hàm này lấy refresh token đang lưu trong máy.
export function getStoredRefreshToken() {
  return safeGetItem(REFRESH_TOKEN_KEY) ?? "";
}

// Hàm này lưu cặp token sau khi đăng nhập hoặc đăng ký.
export function setStoredTokens({ accessToken = "", refreshToken = "" }) {
  safeSetItem(ACCESS_TOKEN_KEY, accessToken);
  safeSetItem(REFRESH_TOKEN_KEY, refreshToken);
}

// Hàm này xóa toàn bộ token khi người dùng đăng xuất hoặc token hết hạn.
export function clearStoredTokens() {
  safeRemoveItem(ACCESS_TOKEN_KEY);
  safeRemoveItem(REFRESH_TOKEN_KEY);
}

// Hàm này đọc user hiện tại từ localStorage để giữ phiên đăng nhập tạm thời.
export function getStoredUser() {
  const rawValue = safeGetItem(USER_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

// Hàm này lưu thông tin user hiện tại để các route protected còn dùng lại được.
export function setStoredUser(user) {
  safeSetItem(USER_KEY, JSON.stringify(user));
}

// Hàm này xóa user hiện tại khỏi localStorage.
export function clearStoredUser() {
  safeRemoveItem(USER_KEY);
}
