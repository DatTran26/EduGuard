import {
  appendActivityLog,
  buildApiResponse,
  buildRefreshResponse,
  createApiError,
  executeMockRequest,
  getCurrentStoredRefreshToken,
  getNextNumericId,
  issueRefreshToken,
  normalizeEmail,
  readMockDatabase,
  requireCurrentUser,
  revokeRefreshToken,
  toUserDto,
  writeMockDatabase,
} from "./mockDatabase";
import { buildMockGoogleProfile, DEFAULT_CAPYBARA_AVATAR_URL } from "../utils/avatar";

// Hàm này tạo access token mock đơn giản để giữ shape response giống backend JWT.
function buildAccessToken(userId) {
  return `mock-access-token-${userId}-${Date.now()}`;
}

// Hàm này kiểm tra dữ liệu đăng ký cơ bản trước khi tạo user mới trong mock database.
function validateRegisterPayload(payload) {
  if (!payload.fullName?.trim()) {
    throw createApiError("Họ và tên không được để trống.");
  }

  if (!payload.email?.trim()) {
    throw createApiError("Email không được để trống.");
  }

  if (!payload.password || payload.password.length < 8) {
    throw createApiError("Mật khẩu cần ít nhất 8 ký tự.");
  }
}

// Hàm này tạo mới user Student bằng form đăng ký thường và gắn sẵn avatar capybara mặc định.
function buildLocalStudentUser(database, payload) {
  const normalizedEmail = normalizeEmail(payload.email);

  return {
    id: getNextNumericId(database.users),
    fullName: payload.fullName.trim(),
    avatarUrl: DEFAULT_CAPYBARA_AVATAR_URL,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    email: normalizedEmail,
    userName: normalizedEmail,
    role: "Student",
    authProvider: "Local",
    // Trường password chỉ để mô phỏng flow auth trong giai đoạn chưa có backend.
    password: payload.password,
  };
}

// Hàm này xử lý profile Google demo để mô phỏng OAuth: có thể login tài khoản cũ hoặc tự tạo mới.
function upsertGoogleStudentUser(database) {
  const googleProfile = buildMockGoogleProfile();
  const normalizedEmail = normalizeEmail(googleProfile.email);
  const matchedUser = database.users.find(
    (userItem) => normalizeEmail(userItem.email) === normalizedEmail,
  );

  if (matchedUser) {
    matchedUser.fullName = googleProfile.fullName;
    matchedUser.avatarUrl = googleProfile.avatarUrl;
    matchedUser.updatedAt = new Date().toISOString();
    matchedUser.authProvider = "Google";

    return {
      isNewUser: false,
      user: matchedUser,
    };
  }

  const newUser = {
    id: getNextNumericId(database.users),
    fullName: googleProfile.fullName,
    avatarUrl: googleProfile.avatarUrl,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    email: normalizedEmail,
    userName: normalizedEmail,
    role: "Student",
    authProvider: "Google",
    password: "",
  };

  database.users.push(newUser);

  return {
    isNewUser: true,
    user: newUser,
  };
}

// Object này mô phỏng toàn bộ auth endpoint để sau này đổi sang backend thật sẽ rất thuận tay.
export const authApi = {
  login(payload) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const normalizedEmail = normalizeEmail(payload.email ?? "");
      const user = database.users.find((userItem) => normalizeEmail(userItem.email) === normalizedEmail);

      if (!user || user.password !== payload.password) {
        throw createApiError("Email hoặc mật khẩu chưa đúng.", 401);
      }

      if (!user.isActive) {
        throw createApiError("Tài khoản hiện đang bị khóa.", 403);
      }

      const refreshToken = issueRefreshToken(database, user.id);
      appendActivityLog(database, {
        userId: user.id,
        action: "AUTH_LOGIN",
        description: `Người dùng ${user.email} đăng nhập vào hệ thống.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Đăng nhập thành công.",
        data: {
          accessToken: buildAccessToken(user.id),
          refreshToken,
          user: toUserDto(user),
        },
      });
    });
  },

  register(payload) {
    return executeMockRequest(() => {
      validateRegisterPayload(payload);

      const database = readMockDatabase();
      const normalizedEmail = normalizeEmail(payload.email);
      const emailExists = database.users.some(
        (userItem) => normalizeEmail(userItem.email) === normalizedEmail,
      );

      if (emailExists) {
        throw createApiError("Email này đã tồn tại trong hệ thống.", 409);
      }

      const newUser = buildLocalStudentUser(database, payload);

      database.users.push(newUser);

      const refreshToken = issueRefreshToken(database, newUser.id);
      appendActivityLog(database, {
        userId: newUser.id,
        action: "AUTH_REGISTER",
        description: `Tạo mới tài khoản student ${newUser.email}.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Đăng ký thành công.",
        data: {
          accessToken: buildAccessToken(newUser.id),
          refreshToken,
          user: toUserDto(newUser),
        },
      });
    });
  },

  continueWithGoogle() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const { isNewUser, user } = upsertGoogleStudentUser(database);

      if (!user.isActive) {
        throw createApiError("Tài khoản Google này hiện đang bị khóa.", 403);
      }

      const refreshToken = issueRefreshToken(database, user.id);
      appendActivityLog(database, {
        userId: user.id,
        action: isNewUser ? "AUTH_REGISTER_GOOGLE" : "AUTH_LOGIN_GOOGLE",
        description: isNewUser
          ? `Tạo mới tài khoản Google ${user.email}.`
          : `Người dùng ${user.email} đăng nhập bằng Google.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: isNewUser
          ? "Đăng ký bằng Google thành công."
          : "Đăng nhập bằng Google thành công.",
        data: {
          accessToken: buildAccessToken(user.id),
          refreshToken,
          user: toUserDto(user),
        },
      });
    });
  },

  me() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);

      return buildApiResponse({
        message: "Lấy thông tin người dùng thành công.",
        data: {
          user: toUserDto(currentUser),
        },
      });
    });
  },

  refreshToken() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentRefreshToken = getCurrentStoredRefreshToken();
      const response = buildRefreshResponse(database, currentRefreshToken);

      writeMockDatabase(database);
      return response;
    });
  },

  logout() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const currentRefreshToken = getCurrentStoredRefreshToken();

      revokeRefreshToken(database, currentRefreshToken);
      appendActivityLog(database, {
        userId: currentUser.id,
        action: "AUTH_LOGOUT",
        description: `Người dùng ${currentUser.email} đăng xuất khỏi hệ thống.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Đăng xuất thành công.",
        data: null,
      });
    });
  },
};
