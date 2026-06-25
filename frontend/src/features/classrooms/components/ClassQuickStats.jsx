import { FiUsers, FiFileText, FiCheckSquare, FiBarChart2, FiAlertTriangle } from "react-icons/fi";

export default function ClassQuickStats({ stats }) {
  const cards = [
    {
      label: "Thành viên",
      value: stats.membersCount,
      icon: FiUsers,
      tone: "neutral",
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: "Bài tập",
      value: stats.assignmentsCount,
      icon: FiFileText,
      tone: "neutral",
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      label: "Bài thi",
      value: stats.examsCount,
      icon: FiCheckSquare,
      tone: "neutral",
      iconColor: "text-sky-500",
      bgColor: "bg-sky-50 dark:bg-sky-950/20",
    },
    {
      label: "Tỉ lệ nộp bài",
      value: `${stats.submissionRate}%`,
      icon: FiBarChart2,
      tone: "caution",
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      label: "Cảnh báo",
      value: stats.warningsCount,
      icon: FiAlertTriangle,
      tone: stats.warningsCount > 0 ? "danger" : "neutral",
      iconColor: stats.warningsCount > 0 ? "text-red-500 animate-pulse" : "text-slate-400",
      bgColor: stats.warningsCount > 0 ? "bg-red-50 dark:bg-red-950/20" : "bg-slate-50 dark:bg-slate-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-sm min-w-0"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.bgColor}`}>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-secondary whitespace-nowrap truncate">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-primary truncate">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
