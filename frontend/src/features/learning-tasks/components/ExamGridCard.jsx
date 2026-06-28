import { useState, useRef, useEffect } from "react";
import {
  FiBookOpen,
  FiUsers,
  FiMoreVertical,
  FiShield,
  FiCheckCircle,
  FiTrash2,
  FiEdit,
  FiPlay,
  FiXCircle,
} from "react-icons/fi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { formatShortDateTime } from "../../../utils/formatDate";

export default function ExamGridCard({
  task,
  onEdit,
  onDelete,
  onPublish,
  onCloseEarly,
  onComposeQuestions,
  onMonitor,
  onViewResults,
  taskActionId = "",
  armedDeleteTaskId = "",
  setArmedDeleteTaskId,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const isDeleteArmed = String(armedDeleteTaskId) === String(task.id);
  const isDeleting = taskActionId === `delete-${task.id}`;
  const isPublishing = taskActionId === `publish-${task.id}`;
  const isClosing = taskActionId === `close-${task.id}`;

  // Determine status color and dot
  const statusMeta = task.status ?? { value: "draft", label: "Bản nháp", tone: "neutral" };
  let statusBadgeClass = "bg-slate-100 text-slate-600 border-slate-200";
  let showPulseDot = false;
  let pulseDotClass = "";

  if (statusMeta.value === "active" || statusMeta.value === "opening") {
    statusBadgeClass = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    showPulseDot = true;
    pulseDotClass = "bg-emerald-500";
  } else if (statusMeta.value === "upcoming") {
    statusBadgeClass = "bg-amber-500/10 text-amber-700 border-amber-500/20";
    showPulseDot = true;
    pulseDotClass = "bg-amber-500";
  } else if (statusMeta.value === "closed") {
    statusBadgeClass = "bg-slate-100 text-slate-600 border-slate-200";
  }

  // Determine primary action
  let primaryAction = {
    label: "Soạn câu hỏi",
    onClick: onComposeQuestions,
    variant: "secondary",
  };

  if (task.isPublished) {
    if (statusMeta.value === "active") {
      primaryAction = {
        label: "Giám sát",
        onClick: onMonitor,
        variant: "primary",
        icon: <FiShield className="mr-1 h-3 w-3" />,
      };
    } else {
      primaryAction = {
        label: "Kết quả",
        onClick: onViewResults,
        variant: "secondary",
        className:
          "border-sky-200 bg-sky-50 text-sky-700 shadow-sm hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800",
        icon: <FiCheckCircle className="mr-1 h-3 w-3" />,
      };
    }
  }

  return (
    <Card className="relative flex min-h-[244px] flex-col justify-between rounded-[18px] border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-100">
      <div className="space-y-2.5">
        <div className="relative min-h-[5.25rem]">
          <span className={`absolute right-0 top-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${statusBadgeClass}`}>
            {showPulseDot && (
              <span className="relative flex h-1 w-1">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseDotClass}`} />
                <span className={`relative inline-flex rounded-full h-1 w-1 ${pulseDotClass}`} />
              </span>
            )}
            {statusMeta.label}
          </span>

          <div className="flex min-h-[5.25rem] flex-col">
            <div className="flex min-h-[1.5rem] items-center pr-20">
              <p className="w-full truncate text-left text-[0.92rem] font-bold text-sky-700" title={task.className}>
                {task.className}
              </p>
            </div>

            <div className="mx-auto flex min-h-[3.15rem] w-full max-w-[82%] items-start justify-center pt-1 text-center">
              <h3
                className="w-full truncate cursor-pointer text-[1.02rem] font-extrabold leading-tight text-slate-900 transition-colors hover:text-sky-700"
                title={task.title}
                onClick={onComposeQuestions}
              >
                {task.title}
              </h3>
            </div>
          </div>
        </div>

        <div className="flex min-h-[2.5rem] items-center justify-center gap-2.5 border-y border-slate-100 py-1 text-[0.82rem] font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <FiBookOpen className="h-3.5 w-3.5 shrink-0 text-sky-500" />
            {task.questionCount} câu hỏi
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <FiUsers className="h-3.5 w-3.5 shrink-0 text-sky-500" />
            {task.attemptCount} lượt làm
          </span>
        </div>

        <div className="min-h-[5.75rem] rounded-[14px] border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-[0.84rem] font-semibold text-slate-700">
          <div className="relative min-w-0 pl-0.5">
            <span className="pointer-events-none absolute left-[4px] top-[9px] h-[30px] w-px rounded-full bg-sky-200" aria-hidden="true" />

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-hidden="true" />
                <p className="truncate font-bold text-slate-800">
                  <span className="mr-1.5 text-[0.69rem] font-bold uppercase tracking-[0.12em] text-slate-400">Mở</span>
                  {formatShortDateTime(task.startTime)}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                <p className="truncate font-bold text-slate-800">
                  <span className="mr-1.5 text-[0.69rem] font-bold uppercase tracking-[0.12em] text-slate-400">Đóng</span>
                  {formatShortDateTime(task.endTime)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100/50 relative">
        <Button 
          className={`flex-1 justify-center py-1 text-[10px] font-bold ${primaryAction.className ?? ""}`}
          onClick={(event) => {
            event.stopPropagation();
            primaryAction.onClick();
          }}
          variant={primaryAction.variant}
        >
          {primaryAction.icon}
          {primaryAction.label}
        </Button>

        {/* Options menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <FiMoreVertical className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1.5 w-44 rounded-xl border border-slate-150 bg-white p-1 shadow-lg z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
              
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <FiEdit className="w-3 h-3 text-slate-400" />
                Chỉnh sửa thông tin
              </button>

              {task.isPublished && statusMeta.value === "active" && task.canCloseEarly && (
                <button
                  type="button"
                  disabled={isClosing}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCloseEarly();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <FiXCircle className="w-3 h-3" />
                  {isClosing ? "Đang đóng..." : "Đóng đề sớm"}
                </button>
              )}

              {!task.isPublished && (
                <button
                  type="button"
                  disabled={isPublishing || task.publishIssueCount > 0}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onPublish();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-medium text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:text-slate-400"
                  title={task.publishIssueCount > 0 ? "Cần soạn ít nhất 1 câu hỏi trước khi phát hành" : ""}
                >
                  <FiPlay className="w-3 h-3" />
                  {isPublishing ? "Đang publish..." : "Phát hành đề"}
                </button>
              )}

              {task.isPublished && statusMeta.value !== "active" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onMonitor();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <FiShield className="w-3 h-3 text-slate-400" />
                  Mở giám sát thi
                </button>
              )}

              {task.isPublished && statusMeta.value === "active" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onViewResults();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <FiCheckCircle className="w-3 h-3 text-slate-400" />
                  Xem kết quả
                </button>
              )}

              {primaryAction.label !== "Soạn câu hỏi" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onComposeQuestions();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <FiBookOpen className="w-3 h-3 text-slate-400" />
                  Soạn câu hỏi
                </button>
              )}

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  if (isDeleteArmed) {
                    onDelete();
                    setIsMenuOpen(false);
                  } else {
                    setArmedDeleteTaskId(String(task.id));
                  }
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-medium rounded-lg transition-colors ${
                  isDeleteArmed 
                    ? "bg-rose-500 text-white hover:bg-rose-600" 
                    : "text-rose-600 hover:bg-rose-50"
                }`}
              >
                <FiTrash2 className="w-3 h-3 shrink-0" />
                {isDeleting 
                  ? "Đang xóa..." 
                  : isDeleteArmed 
                    ? "Xác nhận" 
                    : "Xóa đề thi"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
