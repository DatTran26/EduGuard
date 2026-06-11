/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import { userApi } from "../api/userApi";
import {
  clearStoredTokens,
  clearStoredUser,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  setStoredTokens,
  setStoredUser,
} from "../utils/tokenStorage";

const AuthContext = createContext(undefined);

// Hàm này kiểm tra session đọc từ localStorage có còn đúng shape cơ bản để dùng tiếp hay không.
function hasValidStoredSessionShape() {
  const storedUser = getStoredUser();
  const accessToken = getStoredAccessToken();

  return Boolean(
    storedUser &&
      accessToken &&
      typeof storedUser.id === "number" &&
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

// Hàm này xóa toàn bộ session local khi logout hoặc phiên không còn hợp lệ.
function clearSessionStorage() {
  clearStoredTokens();
  clearStoredUser();
}

// Provider này quản lý phiên đăng nhập hiện tại theo kiểu gần giống SPA thật dùng JWT.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(getInitialSession);
  const [isHydrating, setIsHydrating] = useState(Boolean(getInitialSession().accessToken));

  useEffect(() => {
    let isMounted = true;

    // Hàm này đồng bộ session với mock database để tránh giữ user đã bị thay đổi hoặc xóa.
    async function syncSessionWithDatabase() {
      if (!session.accessToken) {
        setIsHydrating(false);
        return;
      }

      try {
        const response = await authApi.me();

        if (!isMounted) {
          return;
        }

        const nextUser = response.data.user;
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

    syncSessionWithDatabase();

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
    return nextSession;
  }

  // Hàm này gọi mock login API rồi lưu session giống lúc mình nhận JWT thật từ backend.
  async function login(payload) {
    const response = await authApi.login(payload);
    return applyAuthResponse(response);
  }

  // Hàm này gọi mock register API rồi đăng nhập luôn user mới tạo như nhiều app thực tế vẫn làm.
  async function register(payload) {
    const response = await authApi.register(payload);
    return applyAuthResponse(response);
  }

  // Hàm này mô phỏng đăng nhập/đăng ký bằng Google để frontend test social auth trước khi có backend thật.
  async function loginWithGoogle() {
    const response = await authApi.continueWithGoogle();
    return applyAuthResponse(response);
  }

  // Hàm này cập nhật hồ sơ cá nhân xong thì đồng bộ lại session user đang lưu ở local.
  async function updateProfile(payload) {
    const response = await userApi.updateMyProfile(payload);

    persistUserOnly(response.data);
    setSession((previousSession) => ({
      ...previousSession,
      user: response.data,
    }));

    return response.data;
  }

  // Hàm này kiểm tra user hiện tại có thuộc nhóm role được cấp quyền hay không.
  function hasRole(allowedRoles = []) {
    if (allowedRoles.length === 0) {
      return true;
    }

    return allowedRoles.includes(session.user?.role ?? "");
  }

  // Hàm này đăng xuất user hiện tại và thu dọn session local cho sạch.
  async function logout() {
    try {
      if (session.accessToken) {
        await authApi.logout();
      }
    } catch {
      // Đoạn này mình chủ động bỏ qua vì kể cả revoke lỗi thì phía client vẫn nên thoát phiên.
    } finally {
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
        loginWithGoogle,
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
