/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import ToastViewport from "../components/common/ToastViewport";

const ToastContext = createContext(undefined);
const TOAST_LIFETIME_MS = 3000;

// Hàm này tạo id ngắn cho toast để mình thêm và xóa từng popup cho ổn định.
function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Provider này giữ danh sách toast toàn app để page nào cũng có thể bắn thông báo nhanh.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  // Hàm này xóa một toast cụ thể và dọn luôn timer đi kèm để tránh memory leak.
  const dismissToast = useCallback((toastId) => {
    const matchedTimer = timersRef.current.get(toastId);

    if (matchedTimer) {
      window.clearTimeout(matchedTimer);
      timersRef.current.delete(toastId);
    }

    setToasts((previousToasts) => previousToasts.filter((toast) => toast.id !== toastId));
  }, []);

  // Hàm này thêm một toast mới và tự hẹn giờ xóa sau 3 giây đúng theo yêu cầu.
  const showToast = useCallback(({ title = "", message = "", tone = "info" }) => {
    const nextToastId = createToastId();

    setToasts((previousToasts) => [
      ...previousToasts,
      {
        id: nextToastId,
        title: title.trim(),
        message: message.trim(),
        tone,
      },
    ]);

    const timeoutId = window.setTimeout(() => {
      dismissToast(nextToastId);
    }, TOAST_LIFETIME_MS);

    timersRef.current.set(nextToastId, timeoutId);
  }, [dismissToast]);

  useEffect(() => {
    const activeTimers = timersRef.current;

    // Đoạn này dọn toàn bộ timer còn treo khi provider bị hủy để app sạch hơn.
    return () => {
      activeTimers.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{
        dismissToast,
        showToast,
      }}
    >
      {children}
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </ToastContext.Provider>
  );
}

// Hook này giúp các page gọi toast nhanh mà không cần chạm trực tiếp vào context.
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast phải được dùng bên trong ToastProvider.");
  }

  return context;
}
