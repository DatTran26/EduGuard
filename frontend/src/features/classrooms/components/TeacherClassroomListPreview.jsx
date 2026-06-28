import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCopy,
  FiPlus,
} from "react-icons/fi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SkeletonClassroomCard } from "../../../components/common/Skeleton";
import { buildClassroomDetailPathByRole } from "../../../routes/routeConfig";
import { cn } from "../../../utils/cn";
import { formatShortDate } from "../../../utils/formatDate";

function buildPreviewSummary(classrooms) {
  return {
    totalClassrooms: classrooms.length,
    attentionClassrooms: classrooms.filter((classroom) => Number(classroom.alertCount) > 0).length,
  };
}

function TeacherPreviewClassroomCard({ classroom, onCopyCode, role }) {
  const detailPath = buildClassroomDetailPathByRole(role, classroom.id);
  const isOpen = classroom.status !== "closed";
  const alertCount = Number(classroom.alertCount) || 0;
  const statLine = `${classroom.memberCount ?? 0} SV · ${classroom.assignmentCount ?? 0} bài tập · ${classroom.examCount ?? 0} bài thi${alertCount > 0 ? ` · ${alertCount} cảnh báo` : ""}`;

  function handleCopyClick() {
    if (classroom.joinCode) {
      onCopyCode(classroom.joinCode);
    }
  }

  return (
    <Card className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_34px_rgb(15_23_42/4%)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgb(15_23_42/8%)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[1.18rem] font-semibold leading-tight tracking-tight text-slate-950">
              <Link className="transition-colors duration-150 hover:text-sky-700" to={detailPath}>
                {classroom.name}
              </Link>
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Tạo {formatShortDate(classroom.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
                isOpen
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600",
              )}
            >
              {isOpen ? "Đang mở" : "Đã đóng"}
            </span>

            {alertCount > 0 ? (
              <span className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700">
                {alertCount} cảnh báo
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-600">
          <span className="font-medium text-slate-700">{statLine}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleCopyClick}
            className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-colors duration-150 hover:bg-sky-100"
            title="Sao chép mã lớp"
          >
            <FiCopy className="h-3.5 w-3.5" />
            <span className="font-mono uppercase tracking-[0.16em]">
              {classroom.joinCode || "--"}
            </span>
          </button>

          <div className="flex flex-wrap gap-2">
            <Button as={Link} className="inline-flex items-center gap-2" to={detailPath}>
              <span>Mở lớp</span>
              <FiArrowRight className="h-4 w-4" />
            </Button>

            <Button as={Link} to={`${detailPath}?tab=notifications`} variant="secondary">
              Thông báo
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TeacherClassroomListView({
  classrooms,
  visibleClassrooms,
  role,
  isLoading,
  isCreateFormVisible,
  onToggleCreateForm,
  onCopyCode,
  createForm,
  emptyState,
}) {
  const summary = buildPreviewSummary(classrooms);

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-[2rem]">
              Lớp học
            </h1>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {summary.totalClassrooms} lớp
            </span>
            {summary.attentionClassrooms > 0 ? (
              <span className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                {summary.attentionClassrooms} cần chú ý
              </span>
            ) : null}
          </div>

          <Button className="inline-flex items-center gap-2" onClick={onToggleCreateForm}>
            <FiPlus className="h-4 w-4" />
            <span>{isCreateFormVisible ? "Ẩn form tạo lớp" : "Tạo lớp học"}</span>
          </Button>
        </div>
      </section>

      {createForm}

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonClassroomCard key={`teacher-preview-skeleton-${index}`} layout="tile" />
          ))}
        </div>
      ) : visibleClassrooms.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
          {visibleClassrooms.map((classroom) => (
            <TeacherPreviewClassroomCard
              classroom={classroom}
              key={classroom.id}
              onCopyCode={onCopyCode}
              role={role}
            />
          ))}
        </div>
      ) : (
        emptyState
      )}
    </div>
  );
}
