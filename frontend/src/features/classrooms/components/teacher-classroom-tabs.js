export const TEACHER_CLASSROOM_TABS = [
  { id: "overview", label: "Tổng quan" },
  { id: "members", label: "Thành viên" },
  { id: "assignments", label: "Bài tập" },
  { id: "exams", label: "Bài thi" },
  { id: "results", label: "Kết quả" },
  { id: "activity", label: "Hoạt động" },
];

export function normalizeTeacherClassroomTab(tabId) {
  if (tabId === "students") {
    return "members";
  }

  return TEACHER_CLASSROOM_TABS.some((tab) => tab.id === tabId) ? tabId : "overview";
}
