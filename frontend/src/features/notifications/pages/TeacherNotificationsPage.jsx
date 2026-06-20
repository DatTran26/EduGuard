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
      <PageHeader
        eyebrow="Thông báo"
        title="Thông báo gần đây"
        description="Nguồn dữ liệu hiện dùng state realtime/frontend. Danh sách persistent sẽ được mở rộng khi backend notifications API hoàn thiện."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleMarkAllAsRead} variant="secondary">
              Đánh dấu đã đọc
            </Button>
            <Button onClick={handleClearNotifications} variant="ghost">
              Dọn danh sách
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-[20px] border border-border bg-surface p-5">
            <p className="text-sm font-medium text-secondary">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      {notificationItems.length === 0 ? (
        <EmptyState
          title="Chưa có thông báo được lưu"
          description="Khi realtime anti-cheat hoặc các nhắc nhở hệ thống được phát ra, chúng sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="space-y-4">
          {notificationItems.map((item) => {
            const isUnread = item?.createdAt && item.createdAt > lastSeenAt;

            return (
              <Card key={item.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                        {item.tone === "danger" ? "Cảnh báo" : item.tone === "success" ? "Hoàn tất" : "Thông tin"}
                      </span>
                      {isUnread ? (
                        <span className="rounded-full border border-info/20 bg-info-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-info">
                          Chưa đọc
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-semibold text-primary">{item.title || "Thông báo"}</h3>
                  </div>
                  <p className="text-sm text-secondary">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "--"}
                  </p>
                </div>

                <p className="text-sm leading-6 text-secondary">{item.message || "Bạn có thông báo mới."}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
