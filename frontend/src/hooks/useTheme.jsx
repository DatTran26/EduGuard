/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(undefined);
const THEME_STORAGE_KEY = "eduguard_theme";

// Hàm này đọc theme đã lưu để app giữ nguyên giao diện người dùng chọn ở lần mở trước.
function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

// Hàm này áp theme ra document để toàn bộ biến màu trong CSS đổi đồng bộ theo một nguồn chung.
function applyThemeToDocument(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

// Provider này quản lý trạng thái sáng/tối cho toàn frontend và lưu lựa chọn vào localStorage.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Hàm này đảo nhanh giữa giao diện sáng và tối từ cùng một điểm điều khiển.
  function toggleTheme() {
    setTheme((previousTheme) => (previousTheme === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode: theme === "dark",
        setTheme,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Hook này giúp các component đọc và đổi theme mà không phải chạm trực tiếp vào context gốc.
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme phải được dùng bên trong ThemeProvider.");
  }

  return context;
}
