import { FiFolder, FiUsers, FiFileText, FiBookOpen } from "react-icons/fi";

export default function ClassroomSummary({ classrooms = [] }) {
  const totalClassrooms = classrooms.length;
  const totalStudents = classrooms.reduce((acc, c) => acc + (c.memberCount || 0), 0);
  const totalAssignments = classrooms.reduce((acc, c) => acc + (c.assignmentCount || 0), 0);
  const totalExams = classrooms.reduce((acc, c) => acc + (c.examCount || 0), 0);

  const kpis = [
    {
      label: "Tổng lớp",
      value: totalClassrooms,
      icon: <FiFolder className="h-5 w-5" />,
      tone: "info",
    },
    {
      label: "Tổng sinh viên",
      value: totalStudents,
      icon: <FiUsers className="h-5 w-5" />,
      tone: "success",
    },
    {
      label: "Bài tập đang mở",
      value: totalAssignments,
      icon: <FiFileText className="h-5 w-5" />,
      tone: "caution",
    },
    {
      label: "Đề thi đang mở",
      value: totalExams,
      icon: <FiBookOpen className="h-5 w-5" />,
      tone: "tertiary",
    },
  ];

  const TONE_STYLES = {
    info: {
      bg: "bg-info-muted text-info border-info/10",
    },
    success: {
      bg: "bg-success-muted text-success border-success/10",
    },
    caution: {
      bg: "bg-caution-muted text-caution border-caution/10",
    },
    tertiary: {
      bg: "bg-info-muted text-link border-link/10", // Using link color since tertiary tailwind mapping is blue
    },
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const style = TONE_STYLES[kpi.tone] ?? TONE_STYLES.info;
        return (
          <div
            key={kpi.label}
            className="flex items-center justify-between p-4 bg-surface border border-border rounded-[20px] shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="space-y-1 min-w-0">
              <p className="text-[0.78rem] font-semibold text-secondary uppercase tracking-wider truncate">
                {kpi.label}
              </p>
              <p className="text-2xl font-bold text-primary truncate">
                {kpi.value}
              </p>
            </div>
            <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border ${style.bg}`}>
              {kpi.icon}
            </span>
          </div>
        );
      })}
    </div>
  );
}
