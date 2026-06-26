import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiClock,
} from "react-icons/fi";
import StatCard from "../../../components/dashboard/StatCard";
import { cn } from "../../../utils/cn";

const ICON_BY_TONE = {
  neutral: <FiBarChart2 size={18} />,
  info: <FiActivity size={18} />,
  success: <FiActivity size={18} />,
  caution: <FiClock size={18} />,
  danger: <FiAlertTriangle size={18} />,
};

export default function LearningTaskStats({
  activeFilter = "",
  items = [],
  onSelectFilter,
  compact = false,
}) {
  return (
    <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const isActive = (item.filterValue ?? "") === activeFilter;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectFilter?.(item.filterValue ?? "")}
            aria-pressed={isActive}
            className={cn(
              "rounded-[16px] text-left transition-all duration-200 w-full focus:outline-none",
              isActive
                ? "ring-2 ring-sky-200 ring-offset-2 ring-offset-background"
                : "hover:-translate-y-0.5 hover:shadow-sm",
            )}
          >
            <div className="pointer-events-none w-full">
              {compact ? (
                <div className={cn(
                  "border rounded-[16px] p-3 flex items-center justify-between gap-3 shadow-sm transition-all duration-200",
                  
                  // Info tone (blue)
                  item.tone === "info" && (
                    isActive 
                      ? "border-sky-400 bg-sky-200 text-sky-950" 
                      : "border-sky-200 bg-sky-50 text-sky-800"
                  ),
                  
                  // Success tone (green)
                  item.tone === "success" && (
                    isActive 
                      ? "border-emerald-400 bg-emerald-250 text-emerald-950" 
                      : "border-emerald-200 bg-emerald-50 text-emerald-800"
                  ),
                  
                  // Caution tone (yellow/orange)
                  item.tone === "caution" && (
                    isActive 
                      ? "border-amber-400 bg-amber-200 text-amber-950" 
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  ),
                  
                  // Danger tone (red)
                  item.tone === "danger" && (
                    isActive 
                      ? "border-rose-400 bg-rose-200 text-rose-950" 
                      : "border-rose-200 bg-rose-50/90 text-rose-800"
                  ),
                  
                  // Neutral tone (slate)
                  (!item.tone || item.tone === "neutral") && (
                    isActive 
                      ? "border-slate-450 bg-slate-200 text-slate-900" 
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  )
                )}>
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      "shrink-0",
                      isActive ? "text-current" : "text-slate-400"
                    )}>
                      {ICON_BY_TONE[item.tone] ?? ICON_BY_TONE.neutral}
                    </span>
                    <p className="text-[12px] font-bold uppercase tracking-wide">{item.label}</p>
                  </div>
                  <p className="text-[19px] font-black">{item.value}</p>
                </div>
              ) : (
                <StatCard
                  icon={ICON_BY_TONE[item.tone] ?? ICON_BY_TONE.neutral}
                  label={item.label}
                  tone={item.tone}
                  value={item.value}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
