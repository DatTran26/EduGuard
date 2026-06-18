import axiosClient from "./axiosClient";
import { areUserIdsEqual, normalizeUserId, requestApi } from "./apiHelpers";
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
// - Hồ sơ cá nhân hiện vẫn đi qua mockDatabase/localStorage.
// - Riêng quản lí người dùng của admin đã đi backend thật qua /api/users.
// - Auth session là backend thật, nhưng profile update/avatar vẫn chưa có user API backend tương ứng ở frontend.

const DEFAULT_ROLE = "Student";
const ROLE_PRIORITY = ["Admin", "Teacher", "Student"];

function resolvePrimaryRole(roles) {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return roles[0] ?? DEFAULT_ROLE;
}

function normalizeAdminUser(user) {
  const roles = Array.isArray(user?.roles) ? user.roles.filter(Boolean) : [];

  return {
    id: normalizeUserId(user?.id),
    fullName: user?.fullName ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    isActive: typeof user?.isActive === "boolean" ? user.isActive : true,
    createdAt: user?.createdAt ?? null,
    updatedAt: user?.updatedAt ?? null,
    email: user?.email ?? "",
    roles,
    role: resolvePrimaryRole(roles),
  };
}

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
    (user) => normalizeEmail(user.email) === normalizedEmail && !areUserIdsEqual(user.id, currentUser.id),
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
// - getMyProfile / updateMyProfile hiện vẫn là mock endpoint.
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

  async getAll() {
    const apiResponse = await requestApi(() => axiosClient.get("/users"));

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data) ? apiResponse.data.map((user) => normalizeAdminUser(user)) : [],
    };
  },

  async create(payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.post("/users", {
        fullName: payload.fullName?.trim() ?? "",
        email: payload.email?.trim() ?? "",
        password: payload.password ?? "",
        role: payload.role ?? DEFAULT_ROLE,
        isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
      }),
    );

    return {
      ...apiResponse,
      data: normalizeAdminUser(apiResponse.data),
    };
  },

  async update(userId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.put(`/users/${normalizeUserId(userId)}`, {
        fullName: payload.fullName?.trim() ?? "",
        email: payload.email?.trim() ?? "",
        role: payload.role ?? DEFAULT_ROLE,
        isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
      }),
    );

    return {
      ...apiResponse,
      data: normalizeAdminUser(apiResponse.data),
    };
  },

  async delete(userId) {
    const apiResponse = await requestApi(() => axiosClient.delete(`/users/${normalizeUserId(userId)}`));

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },
};
