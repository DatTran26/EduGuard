import { cn } from "../../../utils/cn";
import {
  PROCTORING_AI_DETECTION_FILTERS,
  PROCTORING_FILTERS,
  PROCTORING_VIEW_MODES,
} from "../utils/proctoringRoomHelpers";

export default function ProctoringFilterBar({
  activeFilter,
  activeAiDetectionFilter = "all",
  activeViewMode,
  filteredCount,
  totalCount,
  onFilterChange,
  onAiDetectionFilterChange,
  onViewModeChange,
}) {
  const showAiDetectionFilters = activeFilter === "inProgress";

  function handleFilterChange(filterId) {
    onFilterChange(filterId);
    if (filterId !== "inProgress") {
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
          <p className="text-xs font-medium text-violet-100/90">Lọc theo AI detect</p>
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
