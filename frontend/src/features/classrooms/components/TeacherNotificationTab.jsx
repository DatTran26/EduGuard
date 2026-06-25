import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { notificationApi } from "../../../api/notificationApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";
import { FiPlus, FiCornerDownLeft, FiBell } from "react-icons/fi";

export default function TeacherNotificationTab({ classroom, onNotificationCreated }) {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [searchParams] = useSearchParams();

  // Listen to searchParams to auto-open creation form
  const shouldAutoOpen = searchParams.get("tab") === "notifications" && searchParams.get("create") === "1";
  useEffect(() => {
    if (shouldAutoOpen) {
      setIsFormOpen(true);
    }
  }, [shouldAutoOpen]);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("Info");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadClassroomNotifications() {
    setIsLoading(true);
    try {
      const response = await notificationApi.getClassroomNotifications(classroom.id);
      setNotifications(response.data || []);
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tải thông báo thất bại",
        message: error.message || "Không thể tải danh sách thông báo đã gửi.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClassroomNotifications();
  }, [classroom.id]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      showToast({
        tone: "danger",
        title: "Lỗi kiểm tra",
        message: "Vui lòng nhập tiêu đề thông báo.",
      });
      return;
    }

    if (!content.trim()) {
      showToast({
        tone: "danger",
        title: "Lỗi kiểm tra",
        message: "Vui lòng nhập nội dung thông báo.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await notificationApi.createClassroomNotification({
        classroomId: classroom.id,
        title: title.trim(),
        content: content.trim(),
        type,
      });

      showToast({
        tone: "success",
        title: "Thành công",
        message: "Gửi thông báo tới lớp học thành công.",
      });

      // Reset form & reload list
      setTitle("");
      setContent("");
      setType("Info");
      setIsFormOpen(false);
      loadClassroomNotifications();
      if (onNotificationCreated) {
        onNotificationCreated();
      }
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Gửi thất bại",
        message: error.message || "Đã xảy ra lỗi khi gửi thông báo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isFormOpen) {
    return (
      <Card className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Tạo thông báo mới</h3>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsFormOpen(false)}
            disabled={isSubmitting}
          >
            <span className="flex items-center gap-1">
              <FiCornerDownLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold text-primary">
              Tiêu đề
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề thông báo"
              className="w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-primary transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-semibold text-primary">
              Loại thông báo
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-primary transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              disabled={isSubmitting}
            >
              <option value="Info">Thông báo chung</option>
              <option value="Success">Quan trọng / Khẩn cấp</option>
              <option value="Warning">Cảnh báo nhắc nhở</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-semibold text-primary">
              Nội dung chi tiết
            </label>
            <textarea
              id="content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông báo chi tiết..."
              className="w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-primary transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 resize-y"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi..." : "Gửi thông báo"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header tab */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Thông báo đã gửi</h3>
        <Button onClick={() => setIsFormOpen(true)}>
          <span className="flex items-center gap-2">
            <FiPlus className="h-4 w-4" />
            <span>Tạo thông báo</span>
          </span>
        </Button>
      </div>

      {/* List content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="animate-pulse rounded-[20px] border border-border bg-surface p-5 space-y-3">
              <div className="h-4 w-1/4 bg-border rounded-full" />
              <div className="h-6 w-2/3 bg-border rounded-lg" />
              <div className="h-4 w-full bg-border rounded-lg" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Chưa có thông báo nào"
          description=""
          action={
            <Button onClick={() => setIsFormOpen(true)}>
              <span className="flex items-center gap-1.5">
                <FiPlus className="h-4 w-4" />
                <span>Gửi thông báo đầu tiên</span>
              </span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => {
            const toneClasses = {
              Warning: "border-danger/25 bg-danger-muted text-danger",
              Success: "border-success/25 bg-success-muted text-success",
              Info: "border-info/25 bg-info-muted text-info",
            }[item.type] || "border-info/25 bg-info-muted text-info";

            const toneLabel = {
              Warning: "Cảnh báo",
              Success: "Thành công",
              Info: "Thông báo",
            }[item.type] || "Thông báo";

            return (
              <div
                key={item.id}
                className="border border-border bg-surface rounded-[20px] p-5 space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${toneClasses}`}>
                    {toneLabel}
                  </span>
                  <span className="text-[11px] font-medium text-secondary">
                    {formatShortDateTime(item.createdAt)}
                  </span>
                </div>

                <h4 className="text-base font-bold text-primary">
                  {item.title}
                </h4>

                <p className="text-sm leading-relaxed text-secondary whitespace-pre-line">
                  {item.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
