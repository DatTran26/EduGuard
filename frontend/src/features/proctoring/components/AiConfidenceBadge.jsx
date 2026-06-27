import { cn } from "../../../utils/cn";
import { formatAiConfidence, getAiConfidenceColorClass } from "../utils/proctoringAiHelpers";

export default function AiConfidenceBadge({ confidence, className, size = "md" }) {
  const value = formatAiConfidence(confidence);
  if (value === "—") {
    return null;
  }

  const isLarge = size === "lg";
  const colorClass = getAiConfidenceColorClass(confidence);

  return (
    <div className={cn("shrink-0 text-right leading-none", className)}>
      <p
        className={cn(
          "tabular-nums",
          colorClass,
          isLarge ? "text-lg font-bold" : "text-sm font-bold",
        )}
      >
        {value}
      </p>      <p
        className={cn(
          "mt-0.5 uppercase tracking-wide text-slate-500",
          isLarge ? "text-[10px]" : "text-[9px]",
        )}
      >
        Độ tin cậy
      </p>
    </div>
  );
}
