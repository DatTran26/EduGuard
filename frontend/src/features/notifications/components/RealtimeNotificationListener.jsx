import { useEffect } from "react";
import {
  createNotificationConnection,
  NOTIFICATION_EVENTS,
} from "../../../signalr/notificationConnection";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { appendNotification } from "../notificationStorage";

function normalizeNotificationTone(tone) {
  if (tone === "success" || tone === "danger") {
    return tone;
  }

  return "info";
}

export default function RealtimeNotificationListener() {
  const { accessToken, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
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

      appendNotification(nextItem);
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
  }, [accessToken, isAuthenticated, showToast]);

  return null;
}
