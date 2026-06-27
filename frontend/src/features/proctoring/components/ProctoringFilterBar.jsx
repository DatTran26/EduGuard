import { cn } from "../../../utils/cn";
import { DEFAULT_AI_FILTER_MIN_CONFIDENCE } from "../utils/proctoringAiHelpers";
import {
  PROCTORING_AI_DETECTION_FILTERS,
  PROCTORING_FILTERS,
  PROCTORING_VIEW_MODES,
} from "../utils/proctoringRoomHelpers";

export default function ProctoringFilterBar({
  activeFilter,
  activeAiDetectionFilter = "all",
  aiFilterMinConfidence = DEFAULT_AI_FILTER_MIN_CONFIDENCE,
  activeViewMode,
  aiMonitoringEnabled = true,
  filteredCount,
  totalCount,
  onFilterChange,
  onAiDetectionFilterChange,
  onAiFilterMinConfidenceChange,
  onViewModeChange,
}) {
  const showAiDetectionFilters = activeFilter === "inProgress" && aiMonitoringEnabled;

  function handleFilterChange(filterId) {
    onFilterChange(filterId);
    if (filterId !== "inProgress" || !aiMonitoringEnabled) {
      onAiDetectionFilterChange?.("all");
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Lọc & sắp xếp</p>
          <p className="text-xs text-slate-500">
            Hiển thị {filteredCount}/{totalCount} học sinh · mặc định ưu tiên điểm rủi ro
          </p>
        </div>

        <div
          className="inline-flex rounded-[12px] border border-white/10 bg-white/[0.03] p-1"
          role="tablist"
          aria-label="Chế độ xem camera"
        >
          {PROCTORING_VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={activeViewMode === mode.id}
              className={cn(
                "rounded-[8px] px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                activeViewMode === mode.id
                  ? "bg-sky-500/20 text-sky-100"
                  : "text-slate-400 hover:text-slate-200",
              )}
              onClick={() => onViewModeChange(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROCTORING_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
              activeFilter === filter.id
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200",
            )}
            onClick={() => handleFilterChange(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {showAiDetectionFilters ? (
        <div className="space-y-2 rounded-[14px] border border-violet-400/20 bg-violet-500/[0.04] px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-violet-100/90">Lọc theo AI detect</p>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <span className="whitespace-nowrap text-violet-100/80">Độ tin cậy tối thiểu</span>
              <input
                aria-label="Độ tin cậy tối thiểu cho bộ lọc AI"
                className="w-16 rounded-[8px] border border-white/10 bg-white/[0.04] px-2 py-1 text-center text-xs text-slate-100 outline-none transition-colors focus:border-violet-400/45"
                inputMode="numeric"
                max={100}
                min={0}
                type="number"
                value={aiFilterMinConfidence}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  if (Number.isNaN(nextValue)) {
                    return;
                  }

                  onAiFilterMinConfidenceChange?.(Math.min(100, Math.max(0, nextValue)));
                }}
              />
              <span>%</span>
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Hiển thị sinh viên đang vi phạm AI hoặc có log vi phạm AI trước đó với độ tin cậy từ ngưỡng này trở lên.
          </p>
          <div className="flex flex-wrap gap-2">
            {PROCTORING_AI_DETECTION_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeAiDetectionFilter === filter.id
                    ? "border-violet-400/45 bg-violet-500/20 text-violet-100"
                    : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-violet-300/25 hover:text-violet-100",
                )}
                onClick={() => onAiDetectionFilterChange?.(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
