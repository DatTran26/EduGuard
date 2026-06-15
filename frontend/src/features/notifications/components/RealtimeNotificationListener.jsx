import { useEffect } from "react";
import {
  createNotificationConnection,
  NOTIFICATION_EVENTS,
} from "../../../signalr/notificationConnection";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";

function normalizeNotificationTone(tone) {
  if (tone === "success" || tone === "danger") {
    return tone;
  }

  return "info";
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
      showToast({
        tone: normalizeNotificationTone(notification?.tone),
        title: notification?.title || "Thông báo",
        message: notification?.message || notification?.title || "Bạn có thông báo mới.",
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
