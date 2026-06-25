import Badge from "../../../components/common/Badge";
import RiskBadge from "./RiskBadge";

const TILE_BORDER = {
  Normal: "border-border",
  Watch: "border-caution/40",
  Warning: "border-danger/50",
  Critical: "border-danger ring-2 ring-danger/30",
};

export default function StudentLiveTile({ student, isActive, onSelect, onRequestWatch }) {
  const riskLevel = student.riskLevel ?? "Normal";

  return (
    <button
      className={`flex flex-col overflow-hidden rounded-[16px] border bg-surface text-left transition-shadow ${
        TILE_BORDER[riskLevel] ?? TILE_BORDER.Normal
      } ${isActive ? "shadow-lg" : "hover:shadow-md"}`}
      onClick={() => onSelect?.(student)}
      type="button"
    >
      <div className="relative aspect-video bg-surface-sunken">
        {isActive ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-success">
            Live
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-secondary">
            {student.watchedByTeacherName
              ? `GV ${student.watchedByTeacherName} đang xem`
              : "Bấm để xem live"}
          </div>
        )}
        {riskLevel === "Critical" ? (
          <div className="absolute left-2 top-2 rounded-full bg-danger px-2 py-1 text-[10px] font-semibold text-white">
            Cần xem xét
          </div>
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-primary">{student.studentName}</p>
            <p className="text-xs text-secondary">{student.attemptStatus}</p>
          </div>
          <RiskBadge riskLevel={riskLevel} score={student.suspicionScore} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">{student.cameraStatus}</Badge>
          <Badge variant="neutral">{student.connectionStatus}</Badge>
          {student.warningCount ? <Badge variant="caution">{student.warningCount} cảnh báo</Badge> : null}
        </div>
        {!student.watchedByTeacherId ? (
          <span
            className="text-xs font-semibold text-link"
            onClick={(event) => {
              event.stopPropagation();
              onRequestWatch?.(student);
            }}
            role="presentation"
          >
            Bật xem live
          </span>
        ) : null}
      </div>
    </button>
  );
}
