import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationApi } from "../../../api/notificationApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";
import {
  getNotificationBadgeClasses,
  getNotificationCardClasses,
  getNotificationDotClasses,
  getNotificationTitleClasses,
  getNotificationTypeMeta,
  resolveNotificationPath,
} from "../utils/notificationUtils";
import { FiBell, FiCheckSquare, FiMail, FiUser, FiBookOpen } from "react-icons/fi";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const response = await notificationApi.getMyNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tải thông báo thất bại",
        message: error.message || "Không thể tải danh sách thông báo.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleNotificationClick(item) {
    if (!item.isRead) {
      await handleMarkAsRead(item.userNotificationId);
    }
    navigate(resolveNotificationPath(item, user?.role));
  }

  async function handleMarkAsRead(userNotificationId) {
    const target = notifications.find((n) => n.userNotificationId === userNotificationId);
    if (!target || target.isRead) return;

    try {
      await notificationApi.markAsRead(userNotificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.userNotificationId === userNotificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      
      // Kích hoạt event cập nhật số lượng thông báo chưa đọc trên Header
      window.dispatchEvent(new CustomEvent("eduguard:notification-updated"));
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Thao tác thất bại",
        message: error.message || "Không thể đánh dấu đã đọc.",
      });
    }
  }

  async function handleMarkAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.userNotificationId);
    if (unreadIds.length === 0) {
      showToast({
        tone: "info",
        title: "Thông báo",
        message: "Không có thông báo chưa đọc nào.",
      });
      return;
    }

    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) =>
          !n.isRead ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      showToast({
        tone: "success",
        title: "Thành công",
        message: "Đã đánh dấu đọc tất cả thông báo.",
      });
      
      // Kích hoạt event cập nhật số lượng thông báo chưa đọc trên Header
      window.dispatchEvent(new CustomEvent("eduguard:notification-updated"));
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Thao tác thất bại",
        message: error.message || "Không thể đánh dấu đọc tất cả.",
      });
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Hero Page Title */}
      <div className="eg-page-hero">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgb(59 130 246 / 8%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <PageHeader title="Thông báo" />
          </div>
          {notifications.length > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="secondary"
              disabled={unreadCount === 0}
            >
              <span className="flex items-center gap-2">
                <FiCheckSquare className="h-4 w-4" />
                <span>Đánh dấu đọc tất cả</span>
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Notification List Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse rounded-[20px] border border-border bg-surface p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-1/4 bg-border rounded-full" />
                <div className="h-3 w-16 bg-border rounded-full" />
              </div>
              <div className="h-6 w-2/3 bg-border rounded-lg" />
              <div className="h-4 w-full bg-border rounded-lg" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Chưa có thông báo nào"
          description=""
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => {
            const badgeClasses = getNotificationBadgeClasses(item.type, item);
            const cardClasses = getNotificationCardClasses(item.type, item.isRead, item);
            const titleClasses = getNotificationTitleClasses(item.type, item.isRead, item);

            return (
              <div
                key={item.userNotificationId}
                onClick={() => handleNotificationClick(item)}
                className={[
                  "group relative cursor-pointer border rounded-[20px] p-5 transition-all duration-200",
                  cardClasses,
                ].join(" ")}
              >
                {/* Unread indicator */}
                {!item.isRead && (
                  <span
                    className={`absolute left-4 top-1/2 -translate-y-1/2 h-2.5 w-2.5 shrink-0 rounded-full ${getNotificationDotClasses(item.type, false, item)}`}
                  />
                )}

                <div className={!item.isRead ? "pl-5" : ""}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${badgeClasses}`}>
                        {getNotificationTypeMeta(item.type, item).label}
                      </span>
                      {!item.isRead && (
                        <span className="rounded-full border border-brand/20 bg-brand/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand">
                          Mới
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-secondary">
                      {formatShortDateTime(item.createdAt)}
                    </span>
                  </div>

                  <h3 className={`mt-3 text-base font-bold tracking-tight transition-colors duration-150 ${titleClasses}`}>
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-secondary whitespace-pre-line">
                    {item.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-secondary">
                    <span className="flex items-center gap-1.5">
                      <FiUser className="h-3.5 w-3.5" />
                      <span>{item.senderName}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiBookOpen className="h-3.5 w-3.5" />
                      <span>Lớp: {item.classroomName}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
