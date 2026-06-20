import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/layout/PageHeader";
import {
  readNotificationLastSeenAt,
  readNotifications,
  writeNotificationLastSeenAt,
  writeNotifications,
} from "../notificationStorage";

function buildNotificationSummary(items, lastSeenAt) {
  const unreadCount = items.filter((item) => item?.createdAt && item.createdAt > lastSeenAt).length;

  return [
    { label: "Tổng thông báo", value: items.length },
    { label: "Chưa đọc", value: unreadCount },
    { label: "Cảnh báo", value: items.filter((item) => item.tone === "danger").length },
    { label: "Thành công", value: items.filter((item) => item.tone === "success").length },
  ];
}

export default function TeacherNotificationsPage() {
  const [notificationItems, setNotificationItems] = useState(() => readNotifications());
  const [lastSeenAt, setLastSeenAt] = useState(() => readNotificationLastSeenAt());
  const summaryItems = useMemo(
    () => buildNotificationSummary(notificationItems, lastSeenAt),
    [lastSeenAt, notificationItems],
  );

  useEffect(() => {
    function handleIncomingNotification(event) {
      const nextItem = event?.detail;

      if (!nextItem?.id) {
        return;
      }

      setNotificationItems((previousValue) => [nextItem, ...previousValue].slice(0, 30));
    }

    window.addEventListener("eduguard:notification", handleIncomingNotification);
    return () => window.removeEventListener("eduguard:notification", handleIncomingNotification);
  }, []);

  function handleMarkAllAsRead() {
    const nowIso = new Date().toISOString();
    writeNotificationLastSeenAt(nowIso);
    setLastSeenAt(nowIso);
  }

  function handleClearNotifications() {
    writeNotifications([]);
    setNotificationItems([]);
    handleMarkAllAsRead();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="eg-page-hero">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgb(59 130 246 / 8%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-info">
              Thông báo
            </p>
            <PageHeader
              title="Thông báo gần đây"
              description="Nguồn dữ liệu hiện dùng state realtime/frontend. Danh sách persistent sẽ được mở rộng khi backend notifications API hoàn thiện."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleMarkAllAsRead} variant="secondary">
              Đánh dấu đã đọc
            </Button>
            <Button onClick={handleClearNotifications} variant="ghost">
              Dọn danh sách
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="eg-summary-card">
            <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
            <p className="text-3xl font-bold tracking-tight text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Notification List */}
      {notificationItems.length === 0 ? (
        <EmptyState
          title="Chưa có thông báo được lưu"
          description="Khi realtime anti-cheat hoặc các nhắc nhở hệ thống được phát ra, chúng sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="space-y-3">
          {notificationItems.map((item) => {
            const isUnread = item?.createdAt && item.createdAt > lastSeenAt;
            const tone = item.tone === "danger" ? "danger" : item.tone === "success" ? "success" : "info";
            const toneLabel =
              item.tone === "danger" ? "Cảnh báo" : item.tone === "success" ? "Hoàn tất" : "Thông tin";
            const toneClasses = {
              danger: "border-danger/20 bg-danger-muted text-danger",
              success: "border-success/20 bg-success-muted text-success",
              info: "border-info/20 bg-info-muted text-info",
            }[tone];

            return (
              <div
                key={item.id}
                className={[
                  "eg-notification-item",
                  isUnread ? "eg-notification-item-unread" : "",
                ].join(" ")}
              >
                {isUnread ? (
                  <span className="eg-notification-dot" aria-label="Chưa đọc" />
                ) : (
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-border"
                    aria-hidden="true"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${toneClasses}`}
                    >
                      {toneLabel}
                    </span>
                    {isUnread ? (
                      <span className="rounded-full border border-info/20 bg-info-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-info">
                        Chưa đọc
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-1.5 text-sm font-semibold text-primary">
                    {item.title || "Thông báo"}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-secondary">
                    {item.message || "Bạn có thông báo mới."}
                  </p>
                  <p className="mt-1 text-xs text-secondary">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "--"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
