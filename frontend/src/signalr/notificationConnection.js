import { createSignalRConnection } from "./signalrConnection";

export const NOTIFICATION_EVENTS = {
  receiveNotification: "ReceiveNotification",
};

export function createNotificationConnection() {
  return createSignalRConnection("notifications");
}
