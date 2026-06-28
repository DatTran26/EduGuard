function buildClassQuickStatItems(stats) {
  return [
    {
      label: "Thành viên",
      value: stats.membersCount,
      tone: "info",
    },
    {
      label: "Bài tập",
      value: stats.assignmentsCount,
      tone: "neutral",
    },
    {
      label: "Bài thi",
      value: stats.examsCount,
      tone: "success",
    },
    {
      label: "Tỉ lệ nộp bài",
      value: `${stats.submissionRate}%`,
      tone: "caution",
    },
    {
      label: "Cảnh báo",
      value: stats.warningsCount,
      tone: stats.warningsCount > 0 ? "danger" : "neutral",
    },
  ];
}

export default function ClassQuickStatsPanel({ stats, layout = "stack" }) {
  const items = buildClassQuickStatItems(stats);

  return (
    <div
      className={
        layout === "grid"
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          : "flex flex-col gap-2.5"
      }
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={`eg-exam-summary-card eg-exam-summary-card-${item.tone}`}
        >
          <span aria-hidden="true" className="eg-exam-summary-card-bar" />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
            <p className="text-2xl font-semibold tracking-tight text-primary tabular-nums">
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export { buildClassQuickStatItems };
