import Badge from "../../../components/common/Badge";
import { formatShortDateTime } from "../../../utils/formatDate";
import AuthenticatedEvidenceMedia from "./AuthenticatedEvidenceMedia";
import { getCaptureSourceLabel, getEvidenceTypeMeta } from "../utils/evidenceHelpers";

export default function EvidenceCard({ item, onOpen }) {
  const typeMeta = getEvidenceTypeMeta(item.evidenceType);

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group relative flex flex-col overflow-hidden rounded-[18px] border border-border bg-surface text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0b1220]">
        <AuthenticatedEvidenceMedia
          attemptId={item.attemptId}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          evidenceId={item.id}
          evidenceType={item.evidenceType}
          fileUrl={item.fileUrl}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 to-transparent px-3 py-2.5">
          <Badge className="text-[11px]" variant={typeMeta.tone}>
            {typeMeta.label}
          </Badge>
        </div>
        {typeMeta.isVideo ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
              ▶
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary">{item.studentName || "Sinh viên"}</p>
          <p className="truncate text-xs text-secondary">{item.examTitle || `Đề #${item.examId}`}</p>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-secondary">
          <span>{formatShortDateTime(item.capturedAt)}</span>
          <span className="truncate">{getCaptureSourceLabel(item.captureSource)}</span>
        </div>
        {item.triggerEventType ? (
          <p className="truncate text-[11px] font-medium text-caution">{item.triggerEventType}</p>
        ) : null}
      </div>
    </button>
  );
}
