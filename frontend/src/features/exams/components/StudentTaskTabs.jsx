import { cn } from "../../../utils/cn";

const TAB_OPTIONS = [
  { value: "exams", label: "Bài thi" },
  { value: "assignments", label: "Bài tập" },
];

export default function StudentTaskTabs({ activeTab, onTabChange }) {
  return (
    <div className="rounded-[24px] border border-border bg-surface px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-info">
            Sinh viên
          </p>
          <h1 className="text-[1.9rem] font-semibold tracking-tight text-primary sm:text-[2.2rem]">
            Bài tập / Bài thi
          </h1>
        </div>

        <div className="inline-flex w-full max-w-full rounded-full border border-border bg-surface-sunken p-1.5 sm:w-auto">
          {TAB_OPTIONS.map((tab) => {
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={isActive}
                className={cn(
                  "min-w-0 flex-1 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-6",
                  isActive
                    ? "bg-primary text-white"
                    : "text-secondary hover:bg-surface hover:text-primary",
                )}
                onClick={() => onTabChange(tab.value)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
