import axiosClient from "./axiosClient";

const DEFAULT_ROLE = "Student";
const ROLE_PRIORITY = ["Admin", "Teacher", "Student"];

// Hàm này chọn vai trò ưu tiên cao nhất từ danh sách roles trả về để route frontend không bị chọn nhầm.
function resolvePrimaryRole(roles) {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return roles[0] ?? DEFAULT_ROLE;
}

// Hàm này chuẩn hóa user DTO từ backend về shape mà frontend hiện tại đang dùng.
function normalizeAuthUser(user) {
  const roles = Array.isArray(user?.roles) ? user.roles.filter(Boolean) : [];

  return {
    id: Number(user?.id) || 0,
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    roles,
    role: resolvePrimaryRole(roles),
    avatarUrl: "",
    isActive: true,
    createdAt: null,
    updatedAt: null,
  };
}

// Hàm này đổi response envelope từ backend thành object data gọn để tầng trên dùng thống nhất.
function unwrapApiResponse(response) {
  const apiResponse = response?.data;

  if (!apiResponse?.success) {
    throw new Error(apiResponse?.message || "Yêu cầu không thành công.");
  }

  return apiResponse;
}

// Hàm này gom message lỗi từ axios/backend để UI hiển thị toast dễ hiểu hơn.
function buildClientError(error) {
  const message =
    error.response?.data?.message ||
    error.response?.data?.title ||
    error.message ||
    "Đã có lỗi xảy ra trong lúc gọi API.";
  const nextError = new Error(message);

  nextError.status = error.response?.status;
  return nextError;
}

// Hàm này bọc lời gọi axios để luôn trả lỗi theo một kiểu nhất quán cho frontend.
async function requestAuthApi(requestFactory) {
  try {
    const response = await requestFactory();
    return unwrapApiResponse(response);
  } catch (error) {
    throw buildClientError(error);
  }
}

// Hàm này chuẩn hóa data login/refresh để frontend giữ nguyên flow lưu session hiện tại.
function normalizeLoginResponseData(data) {
  return {
    accessToken: data?.accessToken ?? "",
    refreshToken: data?.refreshToken ?? "",
    user: normalizeAuthUser(data?.user),
  };
}

// Object này gọi auth API thật của backend theo đúng contract trong docs và controller hiện tại.
export const authApi = {
  async login(payload) {
    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/login", {
        email: payload.email?.trim() ?? "",
        password: payload.password ?? "",
      }),
    );

    return {
      ...apiResponse,
      data: normalizeLoginResponseData(apiResponse.data),
    };
  },

  async register(payload) {
    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/register", {
        fullName: payload.fullName?.trim() ?? "",
        email: payload.email?.trim() ?? "",
        password: payload.password ?? "",
      }),
    );

    return {
      ...apiResponse,
      data: normalizeAuthUser(apiResponse.data),
    };
  },

  async me() {
    const apiResponse = await requestAuthApi(() => axiosClient.get("/auth/me"));

    return {
      ...apiResponse,
      data: normalizeAuthUser(apiResponse.data),
    };
  },

  async refreshToken(refreshToken) {
    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/refresh-token", {
        refreshToken,
      }),
    );

    return {
      ...apiResponse,
      data: normalizeLoginResponseData(apiResponse.data),
    };
  },

  async logout(refreshToken) {
    if (!refreshToken) {
      return {
        success: true,
        message: "Đăng xuất thành công.",
        data: null,
      };
    }

    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/logout", {
        refreshToken,
      }),
    );

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },
};
