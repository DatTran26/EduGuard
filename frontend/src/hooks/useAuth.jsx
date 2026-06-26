/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authApi } from "../api/authApi";
import { userApi } from "../api/userApi";
import { normalizeUserId } from "../api/apiHelpers";
import { devLog } from "../utils/devLogger";
import { getAccessTokenRoles } from "../utils/jwtClaims";
import {
  clearStoredTokens,
  clearStoredUser,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  setStoredTokens,
  setStoredUser,
} from "../utils/tokenStorage";
import { AUTH_SESSION_REFRESHED_EVENT } from "../api/auth-token-refresh-service";

// INTEGRATION STATUS:
// - login / register / me / logout đang gọi backend auth thật qua authApi.
// - classroom và exam hiện đã đi backend thật; teacher dashboard cũng đang tổng hợp từ API thật.
// - updateProfile và student dashboard vẫn còn mock.
// - user management của admin đã đi backend thật.
// - Session backend vẫn được bridge sang mock DB để các module còn mock tiếp tục hoạt động liền mạch.

const AuthContext = createContext(undefined);

// Hàm này kiểm tra session đọc từ localStorage có còn đúng shape cơ bản để dùng tiếp hay không.
function hasValidStoredSessionShape() {
  const storedUser = getStoredUser();
  const accessToken = getStoredAccessToken();

  return Boolean(
      storedUser &&
      accessToken &&
      normalizeUserId(storedUser.id).length > 0 &&
      typeof storedUser.email === "string" &&
      typeof storedUser.role === "string",
  );
}

// Hàm này dựng session ban đầu từ localStorage để user F5 trang vẫn còn trạng thái đăng nhập.
function getInitialSession() {
  if (!hasValidStoredSessionShape()) {
    clearStoredTokens();
    clearStoredUser();

    return {
      accessToken: "",
      refreshToken: "",
      user: null,
    };
  }

  return {
    accessToken: getStoredAccessToken(),
    refreshToken: getStoredRefreshToken(),
    user: getStoredUser(),
  };
}

// Hàm này lấy danh sách role hiện tại từ session để route guard xử lý đúng cả trường hợp user có nhiều quyền.
function getUserRoles(user) {
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    return user.roles.filter(Boolean);
  }

  return user?.role ? [user.role] : [];
}

// Hàm này so sánh hai tập role bất kể thứ tự để biết token hiện tại có bị lệch quyền với DB hay không.
function hasSameRoleSets(firstRoles = [], secondRoles = []) {
  const normalizedFirstRoles = [...firstRoles].filter(Boolean).sort();
  const normalizedSecondRoles = [...secondRoles].filter(Boolean).sort();

  if (normalizedFirstRoles.length !== normalizedSecondRoles.length) {
    return false;
  }

  return normalizedFirstRoles.every((role, index) => role === normalizedSecondRoles[index]);
}

function hasSameRoles(firstUser, secondUser) {
  return hasSameRoleSets(getUserRoles(firstUser), getUserRoles(secondUser));
}

// Hàm này so role trong JWT với role từ /auth/me để phát hiện token cũ sau khi quyền được cập nhật.
function accessTokenRolesMismatch(accessToken, user) {
  const tokenRoles = getAccessTokenRoles(accessToken);
  const userRoles = getUserRoles(user);

  if (tokenRoles.length === 0 && userRoles.length === 0) {
    return false;
  }

  return !hasSameRoleSets(tokenRoles, userRoles);
}

// Hàm này lưu session mới sau login, register hoặc refresh profile.
function persistSession(session) {
  setStoredTokens({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });
  setStoredUser(session.user);
}

// Hàm này chỉ cập nhật user hiện tại trong session khi token không thay đổi.
function persistUserOnly(user) {
  setStoredUser(user);
}

// Hàm này trộn profile mock cục bộ vào user auth để avatar/thông tin cá nhân không bị mất sau khi tải lại trang.
function mergeHydratedUserProfile(authUser, profileUser) {
  if (!profileUser) {
    return authUser;
  }

  return {
    ...authUser,
    fullName: profileUser.fullName || authUser.fullName,
    email: profileUser.email || authUser.email,
    avatarUrl: profileUser.avatarUrl ?? authUser.avatarUrl,
    isActive: typeof profileUser.isActive === "boolean" ? profileUser.isActive : authUser.isActive,
    createdAt: profileUser.createdAt ?? authUser.createdAt,
    updatedAt: profileUser.updatedAt ?? authUser.updatedAt,
  };
}

// Hàm này xóa toàn bộ session local khi logout hoặc phiên không còn hợp lệ.
function clearSessionStorage() {
  clearStoredTokens();
  clearStoredUser();
}

// Provider này quản lý phiên đăng nhập hiện tại theo kiểu gần giống SPA thật dùng JWT.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(getInitialSession);
  const [isHydrating, setIsHydrating] = useState(Boolean(getInitialSession().accessToken));
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    function handleSessionRefreshed(event) {
      const nextSession = event.detail;

      if (!nextSession?.accessToken) {
        return;
      }

      setSession((previousSession) => ({
        accessToken: nextSession.accessToken,
        refreshToken: nextSession.refreshToken ?? previousSession.refreshToken,
        user: nextSession.user ?? previousSession.user,
      }));
    }

    window.addEventListener(AUTH_SESSION_REFRESHED_EVENT, handleSessionRefreshed);

    return () => {
      window.removeEventListener(AUTH_SESSION_REFRESHED_EVENT, handleSessionRefreshed);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Hàm này đồng bộ session với auth API thật để F5 trang vẫn lấy lại đúng user từ JWT.
    async function syncSessionWithApi() {
      if (!session.accessToken) {
        setIsHydrating(false);
        return;
      }

      try {
        const response = await authApi.me();
        const currentSession = sessionRef.current;

        if (!isMounted) {
          return;
        }

        let nextUser = response.data;
        let nextRefreshToken = currentSession.refreshToken;
        let nextAccessToken = currentSession.accessToken;

        try {
          const profileResponse = await userApi.getMyProfile();

          if (!isMounted) {
            return;
          }

          nextUser = mergeHydratedUserProfile(response.data, profileResponse.data);
        } catch {
          nextUser = response.data;
        }

        // Nếu role trong DB đã đổi sau lúc user đăng nhập, mình refresh token để claim Role khớp lại.
        const storedRolesChanged = !hasSameRoles(currentSession.user, nextUser);
        const jwtRolesChanged = accessTokenRolesMismatch(currentSession.accessToken, nextUser);

        if (currentSession.refreshToken && (storedRolesChanged || jwtRolesChanged)) {
          if (jwtRolesChanged) {
            devLog.auth("JWT role lệch với /auth/me — đang refresh token", {
              tokenRoles: getAccessTokenRoles(currentSession.accessToken),
              userRoles: getUserRoles(nextUser),
            });
          }

          const refreshResponse = await authApi.refreshToken(currentSession.refreshToken);
          nextAccessToken = refreshResponse.data.accessToken;
          nextRefreshToken = refreshResponse.data.refreshToken;
          nextUser = mergeHydratedUserProfile(refreshResponse.data.user, nextUser);

          persistSession({
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken,
            user: nextUser,
          });
          setSession({
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken,
            user: nextUser,
          });
          return;
        }

        persistUserOnly(nextUser);
        setSession((previousSession) => ({
          ...previousSession,
          user: nextUser,
        }));
      } catch {
        if (!isMounted) {
          return;
        }

        clearSessionStorage();
        setSession({
          accessToken: "",
          refreshToken: "",
          user: null,
        });
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }

    syncSessionWithApi();

    return () => {
      isMounted = false;
    };
  }, [session.accessToken]);

  // Hàm này xử lý response auth chung để login và register không bị lặp code.
  function applyAuthResponse(response) {
    const nextSession = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: response.data.user,
    };

    persistSession(nextSession);
    setSession(nextSession);
    devLog.auth("Session applied", {
      email: nextSession.user?.email,
      role: nextSession.user?.role,
      roles: nextSession.user?.roles,
    });
    return nextSession;
  }

  // Hàm này gọi login API của backend rồi lưu session theo flow JWT hiện tại của app.
  async function login(payload) {
    const response = await authApi.login(payload);
    return applyAuthResponse(response);
  }

  // Hàm này đăng ký qua backend rồi đăng nhập ngay để giữ nguyên trải nghiệm hiện tại của frontend.
  async function register(payload) {
    await authApi.register(payload);
    const response = await authApi.login({
      email: payload.email,
      password: payload.password,
    });
    return applyAuthResponse(response);
  }

  // Hàm này cập nhật hồ sơ cá nhân xong thì đồng bộ lại session user đang lưu ở local.
  async function updateProfile(payload) {
    const response = await userApi.updateMyProfile(payload);
    const nextUser = mergeHydratedUserProfile(session.user, response.data);
    nextUser.roles = getUserRoles(session.user);

    persistUserOnly(nextUser);
    setSession((previousSession) => ({
      ...previousSession,
      user: nextUser,
    }));

    return nextUser;
  }

  // Hàm này kiểm tra user hiện tại có thuộc nhóm role được cấp quyền hay không.
  function hasRole(allowedRoles = []) {
    if (allowedRoles.length === 0) {
      return true;
    }

    const currentRoles = getUserRoles(session.user);
    return currentRoles.some((role) => allowedRoles.includes(role));
  }

  // Hàm này đăng xuất user hiện tại và thu dọn session local cho sạch.
  async function logout() {
    try {
      if (session.accessToken) {
        await authApi.logout(session.refreshToken);
      }
    } catch {
      // Đoạn này mình chủ động bỏ qua vì kể cả revoke lỗi thì phía client vẫn nên thoát phiên.
    } finally {
      devLog.auth("Logout — cleared local session");
      clearSessionStorage();
      setSession({
        accessToken: "",
        refreshToken: "",
        user: null,
      });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken: session.accessToken,
        hasRole,
        isAuthenticated: Boolean(session.user && session.accessToken),
        isHydrating,
        isSkeletonMode: true,
        login,
        logout,
        refreshToken: session.refreshToken,
        register,
        updateProfile,
        user: session.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook này giúp các component con đọc auth state gọn hơn và không phải import context trực tiếp.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider.");
  }

  return context;
}
