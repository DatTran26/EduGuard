import { normalizeUserId } from "./apiHelpers";

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

export function normalizeAuthUser(user) {
  const roles = Array.isArray(user?.roles) ? user.roles.filter(Boolean) : [];

  return {
    id: normalizeUserId(user?.id),
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    roles,
    role: resolvePrimaryRole(roles),
    avatarUrl: user?.avatarUrl ?? "",
    isActive: typeof user?.isActive === "boolean" ? user.isActive : true,
    createdAt: user?.createdAt ?? null,
    updatedAt: user?.updatedAt ?? null,
  };
}

export function unwrapApiResponse(response) {
  const apiResponse = response?.data;

  if (!apiResponse?.success) {
    throw new Error(apiResponse?.message || "Yêu cầu không thành công.");
  }

  return apiResponse;
}

export function normalizeLoginResponseData(data) {
  return {
    accessToken: data?.accessToken ?? "",
    refreshToken: data?.refreshToken ?? "",
    user: normalizeAuthUser(data?.user),
  };
}
