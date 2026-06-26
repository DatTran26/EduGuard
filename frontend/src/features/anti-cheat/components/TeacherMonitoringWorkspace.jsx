import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import ProctoringRoomLink from "../../proctoring/components/ProctoringRoomLink";
import { cn } from "../../../utils/cn";
import { isLiveProctoringRoomAvailable } from "../../proctoring/utils/proctoringRouting";
import AttemptMonitorPanel from "./AttemptMonitorPanel";

const WORKSPACE_VIEWS = {
  live: "live",
  logs: "logs",
};

function ExamStatStrip({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-[14px] border px-3 py-3",
            item.tone === "info" && "border-info/20 bg-info-muted/60",
            item.tone === "success" && "border-success/20 bg-success-muted/60",
            item.tone === "caution" && "border-caution/20 bg-caution-muted/60",
            item.tone === "danger" && "border-danger/20 bg-danger-muted/60",
          )}
        >
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.08em] text-secondary">
            {item.label}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-primary">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function WorkspaceSegment({ activeView, onViewChange, liveAvailable }) {
  return (
    <div
      className="inline-flex w-full max-w-md rounded-[14px] border border-border bg-surface-sunken p-1 sm:w-auto"
      role="tablist"
      aria-label="Chế độ giám sát"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeView === WORKSPACE_VIEWS.live}
        className={cn(
          "flex-1 rounded-[10px] px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none",
          activeView === WORKSPACE_VIEWS.live
            ? "bg-surface text-primary shadow-sm"
            : "text-secondary hover:text-primary",
        )}
        onClick={() => onViewChange(WORKSPACE_VIEWS.live)}
      >
        Camera trực tiếp
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === WORKSPACE_VIEWS.logs}
        className={cn(
          "flex-1 rounded-[10px] px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none",
          activeView === WORKSPACE_VIEWS.logs
            ? "bg-surface text-primary shadow-sm"
            : "text-secondary hover:text-primary",
        )}
        onClick={() => onViewChange(WORKSPACE_VIEWS.logs)}
      >
        Log anti-cheat
      </button>
      {!liveAvailable ? (
        <span className="sr-only">Camera trực tiếp không khả dụng cho đề này</span>
      ) : null}
    </div>
  );
}

function LiveProctoringPanel({ exam }) {
  const liveAvailable = isLiveProctoringRoomAvailable(exam) && exam.isPublished;
  const stats = [
    { label: "Đang làm", value: exam.inProgressCount, tone: "info" },
    { label: "Đã nộp", value: exam.submittedCount, tone: "success" },
    { label: "Cảnh báo", value: exam.totalWarnings, tone: "caution" },
    { label: "Rủi ro cao", value: exam.highRiskCount, tone: "danger" },
  ];

  if (!liveAvailable) {
    return (
      <Card className="space-y-4 border-border bg-neutral p-6">
        <p className="text-sm font-semibold text-primary">Camera trực tiếp chưa sẵn sàng</p>
        <p className="text-sm leading-6 text-secondary">
          {!exam.isPublished
            ? "Đề thi chưa được publish nên chưa mở phòng giám sát."
            : "Bật camera hoặc live proctoring trong cài đặt đề để mở phòng giám sát."}
        </p>
        <ExamStatStrip items={stats} />
      </Card>
    );
  }

  return (
    <Card className="space-y-6 border-info/25 bg-gradient-to-br from-info-muted/50 via-surface to-surface p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-info">Phòng giám sát</p>
          <h3 className="text-xl font-semibold text-primary">Xem sinh viên đang thi qua camera</h3>
          <p className="max-w-xl text-sm leading-6 text-secondary">
            Mở lưới camera live, gửi nhắc nhở, tạm dừng hoặc kết thúc bài làm từng sinh viên.
          </p>
        </div>
        <Button as={ProctoringRoomLink} className="shrink-0" examId={exam.id}>
          Vào phòng giám sát
        </Button>
      </div>
      <ExamStatStrip items={stats} />
    </Card>
  );
}

export default function TeacherMonitoringWorkspace({
  exam,
  view = WORKSPACE_VIEWS.live,
  onViewChange,
  showToast,
}) {
  const activeView = view === WORKSPACE_VIEWS.logs ? WORKSPACE_VIEWS.logs : WORKSPACE_VIEWS.live;
  const liveAvailable = isLiveProctoringRoomAvailable(exam);

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{exam.statusLabel}</Badge>
              {exam.enableAntiCheat ? (
                <Badge variant="caution">Anti-cheat bật</Badge>
              ) : (
                <Badge variant="neutral">Anti-cheat tắt</Badge>
              )}
              {liveAvailable ? <Badge variant="info">Camera live</Badge> : null}
            </div>
            <h2 className="text-xl font-semibold text-primary">{exam.title}</h2>
            <p className="text-sm text-secondary">{exam.classroomName}</p>
          </div>
        </div>

        <WorkspaceSegment
          activeView={activeView}
          liveAvailable={liveAvailable}
          onViewChange={onViewChange}
        />
      </Card>

      {activeView === WORKSPACE_VIEWS.live ? (
        <LiveProctoringPanel exam={exam} />
      ) : (
        <AttemptMonitorPanel
          antiCheatSummary={exam.antiCheatSummary}
          attempts={exam.attempts}
          embedded
          exam={exam}
          onAntiCheatWarning={() => {}}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export { WORKSPACE_VIEWS };
