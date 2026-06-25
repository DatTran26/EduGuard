const NOTIFICATION_STORAGE_KEY = "eg.notifications.items.v1";
const NOTIFICATION_LAST_SEEN_KEY = "eg.notifications.lastSeenAt.v1";

export function readNotifications() {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeNotifications(items) {
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function readNotificationLastSeenAt() {
  try {
    return window.localStorage.getItem(NOTIFICATION_LAST_SEEN_KEY) || "";
  } catch {
    return "";
  }
}

export function writeNotificationLastSeenAt(value) {
  try {
    window.localStorage.setItem(NOTIFICATION_LAST_SEEN_KEY, value);
  } catch {
    // ignore
  }
}

export function appendNotification(item) {
  const nextItems = [item, ...readNotifications()].slice(0, 30);
  writeNotifications(nextItems);
  return nextItems;
}
