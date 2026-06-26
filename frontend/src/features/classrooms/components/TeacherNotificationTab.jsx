import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { notificationApi } from "../../../api/notificationApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";
import { FiPlus, FiCornerDownLeft, FiBell } from "react-icons/fi";
import {
  CLASSROOM_NOTIFICATION_PREVIEW_CLASSES,
  CLASSROOM_NOTIFICATION_TYPES,
  getClassroomNotificationToneClasses,
  getClassroomNotificationCardClasses,
  getClassroomNotificationTypeMeta,
} from "../utils/classroomNotificationUtils";

function getNotifiableStudents(members) {
  return (Array.isArray(members) ? members : []).filter(
    (member) => member.role === "Sinh viên" && member.status === "Active" && member.studentId,
  );
}

export default function TeacherNotificationTab({ classroom, members = [], onNotificationCreated }) {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [searchParams] = useSearchParams();

  const notifiableStudents = useMemo(() => getNotifiableStudents(members), [members]);

  const shouldAutoOpen = searchParams.get("tab") === "notifications" && searchParams.get("create") === "1";
  useEffect(() => {
    if (shouldAutoOpen) {
      setIsFormOpen(true);
    }
  }, [shouldAutoOpen]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("Info");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isFormOpen) {
      return;
    }

    setSelectedRecipientIds(notifiableStudents.map((member) => member.studentId));
  }, [isFormOpen, notifiableStudents]);

  const selectedTypeMeta = getClassroomNotificationTypeMeta(type);
  const previewClasses =
    CLASSROOM_NOTIFICATION_PREVIEW_CLASSES[selectedTypeMeta.tone] ??
    CLASSROOM_NOTIFICATION_PREVIEW_CLASSES.info;
  const allRecipientsSelected =
    notifiableStudents.length > 0 &&
    notifiableStudents.every((member) => selectedRecipientIds.includes(member.studentId));

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

  function toggleRecipient(studentId) {
    setSelectedRecipientIds((previousValue) =>
      previousValue.includes(studentId)
        ? previousValue.filter((id) => id !== studentId)
        : [...previousValue, studentId],
    );
  }

  function handleSelectAllRecipients() {
    setSelectedRecipientIds(notifiableStudents.map((member) => member.studentId));
  }

  function handleClearRecipients() {
    setSelectedRecipientIds([]);
  }

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

    if (selectedRecipientIds.length === 0) {
      showToast({
        tone: "danger",
        title: "Lỗi kiểm tra",
        message: "Vui lòng chọn ít nhất một thành viên để nhận thông báo.",
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
        recipientIds: selectedRecipientIds,
      });

      const recipientCount = selectedRecipientIds.length;
      showToast({
        tone: "success",
        title: "Thành công",
        message:
          recipientCount === notifiableStudents.length
            ? "Gửi thông báo tới toàn bộ lớp học thành công."
            : `Gửi thông báo tới ${recipientCount} thành viên thành công.`,
      });

      setTitle("");
      setContent("");
      setType("Info");
      setSelectedRecipientIds([]);
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
      <Card className="max-w-5xl mx-auto space-y-6">
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
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
                {CLASSROOM_NOTIFICATION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div
                className={`rounded-[14px] border px-4 py-3 text-sm font-medium ${previewClasses}`}
                aria-live="polite"
              >
                {selectedTypeMeta.label}
              </div>
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
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi..." : "Gửi thông báo"}
              </Button>
            </div>
          </form>

          <div className="space-y-3 rounded-[20px] border border-border bg-surface-sunken p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-primary">Người nhận</h4>
                <p className="mt-1 text-xs text-secondary">
                  Đã chọn {selectedRecipientIds.length}/{notifiableStudents.length}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 px-2 py-1 text-xs"
                onClick={allRecipientsSelected ? handleClearRecipients : handleSelectAllRecipients}
                disabled={isSubmitting || notifiableStudents.length === 0}
              >
                {allRecipientsSelected ? "Bỏ chọn" : "Chọn hết"}
              </Button>
            </div>

            {notifiableStudents.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-border bg-surface px-3 py-4 text-sm text-secondary">
                Lớp chưa có sinh viên đang tham gia.
              </p>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {notifiableStudents.map((member) => {
                  const isSelected = selectedRecipientIds.includes(member.studentId);

                  return (
                    <label
                      key={member.studentId}
                      className={`flex cursor-pointer items-start gap-3 rounded-[14px] border px-3 py-3 transition-colors ${
                        isSelected
                          ? "border-brand/30 bg-brand/5"
                          : "border-border bg-surface hover:bg-surface-sunken"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand/20"
                        checked={isSelected}
                        onChange={() => toggleRecipient(member.studentId)}
                        disabled={isSubmitting}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-primary">
                          {member.fullName}
                        </span>
                        {member.email ? (
                          <span className="mt-0.5 block truncate text-xs text-secondary">
                            {member.email}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Thông báo đã gửi</h3>
        <Button onClick={() => setIsFormOpen(true)}>
          <span className="flex items-center gap-2">
            <FiPlus className="h-4 w-4" />
            <span>Tạo thông báo</span>
          </span>
        </Button>
      </div>

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
            const typeMeta = getClassroomNotificationTypeMeta(item.type);
            const toneClasses = getClassroomNotificationToneClasses(item.type);
            const cardClasses = getClassroomNotificationCardClasses(item.type);

            return (
              <div
                key={item.id}
                className={`rounded-[20px] border p-5 space-y-3 ${cardClasses}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${toneClasses}`}
                  >
                    {typeMeta.badgeLabel}
                  </span>
                  <span className="text-[11px] font-medium text-secondary">
                    {formatShortDateTime(item.createdAt)}
                  </span>
                </div>

                <h4 className="text-base font-bold text-primary">{item.title}</h4>

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
