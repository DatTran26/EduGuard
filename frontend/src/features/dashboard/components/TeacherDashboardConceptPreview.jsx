import { Link } from "react-router-dom";
import {
  RiAlertLine,
  RiArrowRightUpLine,
  RiBook2Line,
  RiCalendarScheduleLine,
  RiCloseLine,
  RiPulseLine,
  RiTeamLine,
} from "react-icons/ri";
import {
  buildClassroomDetailPathByRole,
  buildTeacherTasksPath,
  routeConfig,
} from "../../../routes/routeConfig";
import { cn } from "../../../utils/cn";
import { formatShortDateTime } from "../../../utils/formatDate";
import {
  ClassroomPerformanceChart,
  TeacherActivityTrendChart,
} from "./teacher-dashboard-charts";

const TEACHER_ROLE = "Teacher";

const ACTION_TONE_COPY = {
  neutral: {
    label: "nháp",
    barClassName: "bg-[#5b7088]",
    badgeClassName: "bg-[#edf4fb] text-[#476079] ring-[#d7e3ef]",
  },
  info: {
    label: "sắp tới",
    barClassName: "bg-[#315b84]",
    badgeClassName: "bg-[#e9f1fb] text-[#2f567d] ring-[#cadced]",
  },
  success: {
    label: "ổn định",
    barClassName: "bg-[#355544]",
    badgeClassName: "bg-[#eef6f1] text-[#355544] ring-[#d6e3db]",
  },
  caution: {
    label: "theo dõi",
    barClassName: "bg-[#8e5e17]",
    badgeClassName: "bg-[#fff7ea] text-[#8a5912] ring-[#ebd7aa]",
  },
  danger: {
    label: "ưu tiên",
    barClassName: "bg-[#9f3828]",
    badgeClassName: "bg-[#fdefeb] text-[#903323] ring-[#efc5ba]",
  },
};

function getExamCountByLabel(items, label) {
  return items.find((item) => item.label === label)?.value ?? 0;
}

function getClassroomTone(classroom) {
  if (Number(classroom.riskCount) > 0) {
    return {
      label: `${classroom.riskCount} cảnh báo`,
      chipClassName: "bg-[#fdefeb] text-[#903323] ring-[#efc5ba]",
    };
  }

  if (Number(classroom.submissionRate) < 60) {
    return {
      label: `${classroom.submissionRate}% nộp bài`,
      chipClassName: "bg-[#fff7ea] text-[#8a5912] ring-[#ebd7aa]",
    };
  }

  if (Number(classroom.averageScore) > 0 && Number(classroom.averageScore) < 7) {
    return {
      label: `${classroom.averageScore}/10 điểm`,
      chipClassName: "bg-[#e9f1fb] text-[#2f567d] ring-[#cadced]",
    };
  }

  return {
    label: "Ổn định",
    chipClassName: "bg-[#eef6f1] text-[#355544] ring-[#d6e3db]",
  };
}

function buildSnapshot({
  summary,
  activityTrend,
  examStatusBreakdown,
  classroomPerformance,
  actionItems,
  highRiskStudents,
  upcomingExams,
}) {
  const totalWarnings = activityTrend.reduce(
    (sum, item) => sum + (item.alertCount || 0),
    0,
  );
  const attentionClassrooms = classroomPerformance.filter((classroom) => {
    return (
      Number(classroom.riskCount) > 0 ||
      Number(classroom.submissionRate) < 60 ||
      (Number(classroom.averageScore) > 0 && Number(classroom.averageScore) < 7)
    );
  });
  const highlightClassrooms = [...classroomPerformance]
    .sort((firstClassroom, secondClassroom) => {
      const riskDelta =
        Number(secondClassroom.riskCount) - Number(firstClassroom.riskCount);

      if (riskDelta !== 0) {
        return riskDelta;
      }

      const submissionDelta =
        Number(firstClassroom.submissionRate) -
        Number(secondClassroom.submissionRate);

      if (submissionDelta !== 0) {
        return submissionDelta;
      }

      return (
        Number(firstClassroom.averageScore) -
        Number(secondClassroom.averageScore)
      );
    })
    .slice(0, 4);

  return {
    totalWarnings,
    draftExams: getExamCountByLabel(examStatusBreakdown, "Bản nháp"),
    openExams: getExamCountByLabel(examStatusBreakdown, "Đang mở"),
    attentionClassrooms,
    highlightClassrooms,
    topActionItems: actionItems.slice(0, 4),
    topUpcomingExams: upcomingExams.slice(0, 4),
    topRiskStudents: highRiskStudents.slice(0, 4),
    summary,
  };
}

function Surface({ className, children }) {
  return (
    <section
      className={cn(
        "rounded-[26px] bg-white p-4 ring-1 ring-[#d6e0eb] shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SnapshotStat({ label, value, tone = "default" }) {
  const toneClassName = {
    default: "bg-[#eef4fb] text-[#0f172a] ring-[#d6e3f0]",
    info: "bg-[#e7f0fb] text-[#214d79] ring-[#cadbef]",
    danger: "bg-[#fdefeb] text-[#903323] ring-[#efc5ba]",
  };

  return (
    <div
      className={cn(
        "rounded-[18px] px-3.5 py-3.5 ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5",
        toneClassName[tone] ?? toneClassName.default,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-current/70">
        {label}
      </p>
      <p className="mt-1 text-[1.3rem] font-semibold tracking-[-0.05em] tabular-nums text-current">
        {value}
      </p>
    </div>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-[18px] bg-white/[0.07] px-3.5 py-3 ring-1 ring-white/10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
        {label}
      </p>
      <p className="mt-1 text-[1.15rem] font-semibold tracking-[-0.04em] tabular-nums text-white">
        {value}
      </p>
    </div>
  );
}

function QuickAction({ label, to, tone = "dark" }) {
  const toneClassName = {
    dark: "bg-white text-[#0f172a] ring-white/[0.16] shadow-[0_10px_24px_rgba(8,15,27,0.18)]",
    soft: "bg-[#182338] text-[#dce7f4] ring-white/10",
  };
  const iconClassName =
    tone === "dark"
      ? "bg-[#edf4fb] text-[#0f172a]"
      : "bg-white/10 text-white";

  return (
    <Link
      className={cn(
        "group inline-flex min-h-[48px] items-center justify-between rounded-[18px] px-4 py-3 text-sm font-semibold ring-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:scale-[0.985]",
        toneClassName[tone] ?? toneClassName.dark,
      )}
      to={to}
    >
      <span>{label}</span>
      <span
        className={cn(
          "ml-4 inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]",
          iconClassName,
        )}
      >
        <RiArrowRightUpLine className="h-4 w-4" />
      </span>
    </Link>
  );
}

function ActionItemRow({ item }) {
  const tone = ACTION_TONE_COPY[item.tone] ?? ACTION_TONE_COPY.info;

  return (
    <article className="rounded-[20px] bg-[#f5f8fc] px-4 py-3.5 ring-1 ring-[#dde7f1] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 h-10 w-1.5 shrink-0 rounded-full", tone.barClassName)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.98rem] font-semibold tracking-[-0.02em] text-[#0f172a]">
                {item.title}
              </p>
              <p className="mt-1 text-sm leading-5 text-[#556476]">{item.detail}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-[14px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ring-1",
                tone.badgeClassName,
              )}
            >
              {tone.label}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoRow({ eyebrow, title, detail, trailing, className }) {
  return (
    <div
      className={cn(
        "rounded-[18px] bg-[#f5f8fc] px-4 py-3 ring-1 ring-[#dde7f1] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#728399]">
            {eyebrow}
          </p>
          <p className="mt-1 text-sm font-semibold tracking-[-0.02em] text-[#0f172a]">
            {title}
          </p>
          <p className="mt-1 text-sm leading-5 text-[#556476]">{detail}</p>
        </div>
        {trailing}
      </div>
    </div>
  );
}

function ClassroomCard({ classroom }) {
  const tone = getClassroomTone(classroom);
  const detailPath = buildClassroomDetailPathByRole(TEACHER_ROLE, classroom.id);

  return (
    <article className="rounded-[22px] bg-[#f5f8fc] px-4 py-4 ring-1 ring-[#d9e3ee] shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#728399]">
              lớp học
            </p>
            <h3 className="mt-1.5 text-[1.05rem] font-semibold tracking-[-0.04em] text-[#0f172a]">
              <Link
                className="transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#214d79]"
                to={detailPath}
              >
                {classroom.name}
              </Link>
            </h3>
          </div>
          <span
            className={cn(
              "rounded-[14px] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ring-1",
              tone.chipClassName,
            )}
          >
            {tone.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[18px] bg-white px-3.5 py-3 ring-1 ring-[#e0e8f1]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#728399]">
              SV
            </p>
            <p className="mt-1 text-[0.98rem] font-semibold tabular-nums text-[#0f172a]">
              {classroom.studentCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#728399]">
              Nộp bài
            </p>
            <p className="mt-1 text-[0.98rem] font-semibold tabular-nums text-[#0f172a]">
              {classroom.submissionRate}%
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#728399]">
              Điểm TB
            </p>
            <p className="mt-1 text-[0.98rem] font-semibold tabular-nums text-[#0f172a]">
              {classroom.averageScore}/10
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-[#556476]">
          <span>{classroom.assignmentCount} bài tập</span>
          <Link
            className="inline-flex items-center gap-1.5 font-semibold text-[#214d79] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-0.5"
            to={detailPath}
          >
            <span>Mở lớp</span>
            <RiArrowRightUpLine className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function TeacherDashboardConceptPreview({
  summary,
  activityTrend,
  examStatusBreakdown,
  classroomPerformance,
  actionItems,
  highRiskStudents,
  upcomingExams,
  onExitPreview,
}) {
  const snapshot = buildSnapshot({
    summary,
    activityTrend,
    examStatusBreakdown,
    classroomPerformance,
    actionItems,
    highRiskStudents,
    upcomingExams,
  });

  return (
    <main className="mx-auto max-w-[1320px] space-y-4 text-[#0f172a]">
      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Surface className="bg-[linear-gradient(180deg,#ffffff_0%,#f3f7fb_100%)]">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex rounded-full bg-[#edf4fb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5c6f84] ring-1 ring-[#d7e3ef]">
                  preview
                </span>
                <h1 className="text-[clamp(2rem,3.6vw,3.3rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[#0f172a]">
                  Dashboard giảng viên
                </h1>
              </div>

              <button
                type="button"
                onClick={onExitPreview}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#edf4fb] text-[#47576b] ring-1 ring-[#d7e3ef] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
              >
                <RiCloseLine className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SnapshotStat
                label="lớp đang quản lý"
                value={snapshot.summary.managedClassrooms}
              />
              <SnapshotStat label="sinh viên" value={snapshot.summary.totalStudents} />
              <SnapshotStat label="cảnh báo" tone="danger" value={snapshot.totalWarnings} />
              <SnapshotStat label="đề đang mở" tone="info" value={snapshot.openExams} />
            </div>
          </div>
        </Surface>

        <Surface className="bg-[#0f172a] text-white ring-[#0f172a]/10 shadow-[0_24px_44px_rgba(15,23,42,0.16)]">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                tác vụ nhanh
              </p>
              <h2 className="mt-1 text-[1.3rem] font-semibold tracking-[-0.04em] text-white">
                Đi thẳng vào việc
              </h2>
            </div>

            <div className="grid gap-3">
              <QuickAction
                label="Tạo bài tập"
                to={buildTeacherTasksPath("assignment", { create: 1 })}
              />
              <QuickAction
                label="Tạo đề thi"
                to={buildTeacherTasksPath("exam", { create: 1 })}
                tone="soft"
              />
              <QuickAction
                label="Vào lớp học"
                to={routeConfig.teacherClassrooms}
                tone="soft"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DarkMetric label="đề nháp" value={snapshot.draftExams} />
              <DarkMetric
                label="lớp chú ý"
                value={snapshot.attentionClassrooms.length}
              />
              <DarkMetric
                label="việc cần xử lý"
                value={snapshot.topActionItems.length}
              />
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Surface>
          <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#728399]">
                  classroom focus
                </p>
                <h2 className="mt-1 text-[1.45rem] font-semibold tracking-[-0.05em] text-[#0f172a]">
                  Lớp cần chú ý trước
                </h2>
              </div>
              <p className="text-sm font-medium text-[#4b5d73]">
                {snapshot.highlightClassrooms.length} lớp cần xem ngay
              </p>
            </div>

            {snapshot.highlightClassrooms.length === 0 ? (
              <InfoRow
                eyebrow="ổn định"
                title="Không có lớp cần ưu tiên"
                detail="Chưa có lớp nào vượt ngưỡng cảnh báo hoặc tụt hiệu suất."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {snapshot.highlightClassrooms.map((classroom) => (
                  <ClassroomCard classroom={classroom} key={classroom.id} />
                ))}
              </div>
            )}
          </div>
        </Surface>

        <div className="grid gap-4">
          <Surface>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#728399]">
                  ưu tiên hôm nay
                </p>
                <h2 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.04em] text-[#0f172a]">
                  Việc cần xử lý
                </h2>
              </div>

              {snapshot.topActionItems.length === 0 ? (
                <InfoRow
                  eyebrow="trống"
                  title="Chưa có việc nào cần xử lý ngay"
                  detail="Danh sách tác vụ đang rỗng ở thời điểm hiện tại."
                />
              ) : (
                <div className="grid gap-3">
                  {snapshot.topActionItems.map((item) => (
                    <ActionItemRow item={item} key={item.id} />
                  ))}
                </div>
              )}
            </div>
          </Surface>

          <Surface>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#728399]">
                    sắp diễn ra
                  </p>
                  <h2 className="mt-1 text-[1.3rem] font-semibold tracking-[-0.04em] text-[#0f172a]">
                    Lịch thi gần
                  </h2>
                </div>
                <RiCalendarScheduleLine className="mt-1 h-5 w-5 text-[#315b84]" />
              </div>

              <div className="space-y-3">
                {snapshot.topUpcomingExams.length === 0 ? (
                  <InfoRow
                    eyebrow="lịch"
                    title="Không có mốc gần"
                    detail="Hiện chưa có bài kiểm tra nào sắp mở."
                  />
                ) : (
                  snapshot.topUpcomingExams.map((exam) => (
                    <InfoRow
                      eyebrow={exam.classroomName}
                      key={exam.id}
                      title={exam.title}
                      detail={formatShortDateTime(exam.startTime)}
                    />
                  ))
                )}
              </div>
            </div>
          </Surface>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Surface>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#728399]">
                  cần lưu ý
                </p>
                <h2 className="mt-1 text-[1.3rem] font-semibold tracking-[-0.04em] text-[#0f172a]">
                  Sinh viên có rủi ro
                </h2>
              </div>
              <RiTeamLine className="mt-1 h-5 w-5 text-[#903323]" />
            </div>

            <div className="space-y-3">
              {snapshot.topRiskStudents.length === 0 ? (
                <InfoRow
                  eyebrow="ổn định"
                  title="Không có trường hợp cần rà soát"
                  detail="Chưa có sinh viên nào vượt ngưỡng cảnh báo."
                />
              ) : (
                snapshot.topRiskStudents.map((student) => (
                  <InfoRow
                    eyebrow={`${student.totalSuspicion} điểm nghi ngờ`}
                    key={student.id}
                    title={student.studentName}
                    detail={student.latestExamTitle}
                    trailing={
                      <RiAlertLine className="mt-1 h-4 w-4 shrink-0 text-[#903323]" />
                    }
                  />
                ))
              )}
            </div>
          </div>
        </Surface>

        <div className="grid gap-4 md:grid-cols-2">
          <Surface>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#728399]">
                    nhịp độ
                  </p>
                  <h2 className="mt-1 text-[1.25rem] font-semibold tracking-[-0.04em] text-[#0f172a]">
                    Hoạt động 7 ngày
                  </h2>
                </div>
                <RiPulseLine className="mt-1 h-5 w-5 text-[#315b84]" />
              </div>
              <TeacherActivityTrendChart data={activityTrend} />
            </div>
          </Surface>

          <Surface>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#728399]">
                    chất lượng theo lớp
                  </p>
                  <h2 className="mt-1 text-[1.25rem] font-semibold tracking-[-0.04em] text-[#0f172a]">
                    Hiệu suất hiện tại
                  </h2>
                </div>
                <RiBook2Line className="mt-1 h-5 w-5 text-[#315b84]" />
              </div>
              <ClassroomPerformanceChart data={classroomPerformance} />
            </div>
          </Surface>
        </div>
      </section>
    </main>
  );
}
