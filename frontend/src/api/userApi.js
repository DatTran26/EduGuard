import {
  appendActivityLog,
  buildApiResponse,
  createApiError,
  executeMockRequest,
  normalizeEmail,
  readMockDatabase,
  requireCurrentUser,
  toUserDto,
  writeMockDatabase,
} from "./mockDatabase";

// MOCK STATUS:
// - Hồ sơ cá nhân và danh sách người dùng admin hiện vẫn đi qua mockDatabase/localStorage.
// - Auth session là backend thật, nhưng profile update/avatar vẫn chưa có user API backend tương ứng ở frontend.

// Hàm này kiểm tra dữ liệu hồ sơ trước khi cập nhật để tránh lưu thông tin nửa vời.
function validateProfilePayload(payload) {
  if (!payload.fullName?.trim()) {
    throw createApiError("Họ và tên không được để trống.");
  }

  if (!payload.email?.trim()) {
    throw createApiError("Email không được để trống.");
  }
}

// Hàm này gom logic cập nhật user hiện tại để cả auth context và profile page dùng chung.
function updateCurrentUserProfile(database, currentUser, payload) {
  validateProfilePayload(payload);

  const normalizedEmail = normalizeEmail(payload.email);
  const emailExists = database.users.some(
    (user) => normalizeEmail(user.email) === normalizedEmail && user.id !== currentUser.id,
  );

  if (emailExists) {
    throw createApiError("Email này đang được tài khoản khác sử dụng.", 409);
  }

  currentUser.fullName = payload.fullName.trim();
  currentUser.email = normalizedEmail;
  currentUser.userName = normalizedEmail;
  currentUser.avatarUrl = payload.avatarUrl?.trim() || "";
  currentUser.updatedAt = new Date().toISOString();

  return currentUser;
}

// MOCK ENDPOINT GROUP:
// - getMyProfile / updateMyProfile / getAll hiện đều đang là mock endpoint.
export const userApi = {
  getMyProfile() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);

      return buildApiResponse({
        message: "Lấy hồ sơ cá nhân thành công.",
        data: toUserDto(currentUser),
      });
    });
  },

  updateMyProfile(payload) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const updatedUser = updateCurrentUserProfile(database, currentUser, payload);

      appendActivityLog(database, {
        userId: currentUser.id,
        action: "USER_UPDATE_PROFILE",
        description: `Người dùng ${currentUser.email} cập nhật hồ sơ cá nhân.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Cập nhật hồ sơ thành công.",
        data: toUserDto(updatedUser),
      });
    });
  },

  getAll() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);

      if (currentUser.role !== "Admin") {
        throw createApiError("Chỉ quản trị viên mới có quyền xem danh sách người dùng.", 403);
      }

      return buildApiResponse({
        message: "Lấy danh sách người dùng thành công.",
        data: database.users
          .map((user) => toUserDto(user))
          .sort((firstUser, secondUser) => firstUser.fullName.localeCompare(secondUser.fullName, "vi")),
      });
    });
  },
};
