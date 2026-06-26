import { cn } from "../../../utils/cn";

export default function LearningTaskTypeTabs({
  options = [],
  selectedType,
  onChange,
}) {
  return (
    <div className="rounded-[20px] border border-border bg-surface p-1.5 shadow-sm">
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((option) => {
          const isActive = option.value === selectedType;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-[16px] border px-3 py-3 text-center transition-all duration-200 sm:px-4",
                isActive
                  ? "border-sky-200 bg-sky-50 text-primary shadow-[0_12px_24px_rgb(14_116_144/10%)]"
                  : "border-transparent bg-surface-sunken text-secondary hover:border-border hover:bg-surface hover:text-primary",
              )}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
