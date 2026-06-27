import { useMemo, useState } from "react";
import { FiAlertTriangle, FiChevronDown, FiChevronUp, FiCpu } from "react-icons/fi";
import Badge from "../../../components/common/Badge";
import { cn } from "../../../utils/cn";
import { formatShortDateTime } from "../../../utils/formatDate";
import AiConfidenceBadge from "./AiConfidenceBadge";
import {
  formatAiViolationLabel,
  getAiDetectionMeta,
  isAiAntiCheatEventType,
  isAiViolationEvent,
  parseAiDetectionMetadata,
  sanitizeAiViolationDescription,
} from "../utils/proctoringAiHelpers";
import { getAntiCheatEventMeta } from "../../anti-cheat/antiCheatHelpers";

const MAX_VISIBLE_ITEMS = 40;

function buildFeedItem(entry) {
  if (entry.source === "ai") {
    const meta = getAiDetectionMeta(entry.detectionType);
    return {
      id: entry.id,
      studentName: entry.studentName,
      title: formatAiViolationLabel(meta.label),
      variant: entry.isFlagged ? meta.variant : "neutral",
      confidence: entry.confidence,
      detail: "",
      occurredAt: entry.occurredAt,
      isHighlighted: entry.isFlagged,
    };
  }

  const meta = getAntiCheatEventMeta(entry.type);
  const aiMeta = isAiAntiCheatEventType(entry.type)
    ? parseAiDetectionMetadata(entry.metadata)
    : null;

  return {
    id: entry.id,
    studentName: entry.studentName,
    title: isAiAntiCheatEventType(entry.type) ? formatAiViolationLabel(meta.label) : meta.label,
    variant: meta.variant,
    confidence: aiMeta?.detectionType != null ? aiMeta.confidence : null,
    detail: sanitizeAiViolationDescription(entry.description),
    occurredAt: entry.occurredAt,
    isHighlighted: true,
  };
}

export default function ProctoringAiAlertFeed({
  aiEvents = [],
  violationEvents = [],
  onSelectStudent,
  className,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllDetections, setShowAllDetections] = useState(false);

  const feedItems = useMemo(() => {
    const merged = [
      ...aiEvents.map((event) => ({ ...event, source: "ai" })),
      ...violationEvents.map((event) => ({ ...event, source: "violation" })),
    ]
      .filter((entry) => (showAllDetections ? true : entry.source === "violation" || isAiViolationEvent(entry)))
      .sort((first, second) => new Date(second.occurredAt) - new Date(first.occurredAt))
      .slice(0, MAX_VISIBLE_ITEMS)
      .map((entry, index) => ({
        ...buildFeedItem(entry),
        attemptId: entry.examAttemptId,
        key: `${entry.source}-${entry.examAttemptId ?? entry.id}-${entry.occurredAt}-${index}`,
      }));

    return merged;
  }, [aiEvents, showAllDetections, violationEvents]);

  const flaggedCount = useMemo(
    () => feedItems.filter((item) => item.isHighlighted).length,
    [feedItems],
  );

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[16px] border border-white/10 bg-[#0b1220]/95 backdrop-blur-sm",
        className,
      )}
    >
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setIsExpanded((value) => !value)}
        type="button"
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-amber-400/25 bg-amber-500/10 text-amber-200">
            <FiCpu className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Cảnh báo AI & vi phạm</p>
            <p className="truncate text-xs text-slate-400">
              {feedItems.length ? `${feedItems.length} sự kiện gần đây` : "Chưa có cảnh báo"}
              {flaggedCount ? ` · ${flaggedCount} cần chú ý` : ""}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <FiChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <FiChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      {isExpanded ? (
        <div className="border-t border-white/10">
          <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-2">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                checked={showAllDetections}
                className="rounded border-white/20 bg-transparent"
                onChange={(event) => setShowAllDetections(event.target.checked)}
                type="checkbox"
              />
              Hiện cả kết quả AI bình thường
            </label>
          </div>

          <div className="max-h-[280px] overflow-y-auto px-2 py-2">
            {feedItems.length ? (
              <ul className="space-y-1.5">
                {feedItems.map((item) => (
                  <li key={item.key}>
                    <button
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[12px] border px-3 py-2.5 text-left transition-colors",
                        item.isHighlighted
                          ? "border-rose-400/20 bg-rose-500/10 hover:bg-rose-500/15"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]",
                      )}
                      onClick={() => onSelectStudent?.(item.attemptId)}
                      type="button"
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.isHighlighted ? (
                          <FiAlertTriangle className="h-4 w-4 text-rose-300" />
                        ) : (
                          <FiCpu className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-100">{item.studentName}</p>
                            <Badge variant={item.variant}>{item.title}</Badge>
                          </div>
                          {item.confidence != null ? (
                            <AiConfidenceBadge confidence={item.confidence} className="mt-0.5" />
                          ) : null}
                        </div>
                        {item.detail ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{item.detail}</p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-slate-500">{formatShortDateTime(item.occurredAt)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 py-6 text-center text-sm text-slate-500">
                Chưa có kết quả AI hoặc vi phạm. Khi học sinh làm bài, log sẽ hiện tại đây theo thời gian thực.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
