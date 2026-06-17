import { useEffect } from "react";
import {
  createNotificationConnection,
  NOTIFICATION_EVENTS,
} from "../../../signalr/notificationConnection";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";

const NOTIFICATION_STORAGE_KEY = "eg.notifications.items.v1";

function normalizeNotificationTone(tone) {
  if (tone === "success" || tone === "danger") {
    return tone;
  }

  return "info";
}

function safeParseNotifications() {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteNotifications(items) {
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export default function RealtimeNotificationListener() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const connection = createNotificationConnection();

    function handleNotification(notification) {
      const nowIso = new Date().toISOString();
      const nextItem = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: nowIso,
        tone: normalizeNotificationTone(notification?.tone),
        title: notification?.title || "Thông báo",
        message: notification?.message || notification?.title || "Bạn có thông báo mới.",
      };

      const existing = safeParseNotifications();
      const nextItems = [nextItem, ...existing].slice(0, 30);
      safeWriteNotifications(nextItems);
      window.dispatchEvent(new CustomEvent("eduguard:notification", { detail: nextItem }));

      showToast({
        tone: nextItem.tone,
        title: nextItem.title,
        message: nextItem.message,
      });
    }

    connection.on(NOTIFICATION_EVENTS.receiveNotification, handleNotification);
    connection.start().catch(() => {});

    return () => {
      connection.off(NOTIFICATION_EVENTS.receiveNotification, handleNotification);
      connection.stop().catch(() => {});
    };
  }, [isAuthenticated, showToast]);

  return null;
}
