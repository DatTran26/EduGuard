export const ADMIN_CLASSROOM_SORT_OPTIONS = [
  { label: "Tên lớp học (A-Z)", value: "name-asc" },
  { label: "Tên lớp học (Z-A)", value: "name-desc" },
  { label: "Số thành viên (nhiều đến ít)", value: "members-desc" },
  { label: "Số thành viên (ít đến nhiều)", value: "members-asc" },
];

export function buildSummaryItems(classrooms) {
  const teacherCount = new Set(classrooms.map((classroom) => classroom.teacherId)).size;
  const totalMembers = classrooms.reduce(
    (totalValue, classroom) =>
      totalValue + (typeof classroom.memberCount === "number" ? classroom.memberCount : 0),
    0,
  );

  return [
    { label: "Tổng số lớp học", value: classrooms.length },
    { label: "Giảng viên", value: teacherCount },
    { label: "Thành viên", value: totalMembers },
  ];
}

export function getPageCopyByRole(role) {
  if (role === "Admin") {
    return {
      title: "Quản lý lớp học",
      actionLabel: null,
    };
  }

  if (role === "Teacher") {
    return {
      title: "Lớp học của giảng viên",
      actionLabel: null,
    };
  }

  return {
    title: "Lớp của tôi",
    actionLabel: "Tham gia lớp",
  };
}

export function filterAndSortAdminClassrooms(classrooms, searchTerm, sortOption) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredClassrooms = classrooms.filter((classroom) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    const classroomName = classroom.name?.toLowerCase() ?? "";
    const teacherName = classroom.teacherName?.toLowerCase() ?? "";

    return classroomName.includes(normalizedSearchTerm) || teacherName.includes(normalizedSearchTerm);
  });

  return filteredClassrooms.slice().sort((firstClassroom, secondClassroom) => {
    if (sortOption === "name-desc") {
      return secondClassroom.name.localeCompare(firstClassroom.name, "vi");
    }

    if (sortOption === "members-desc") {
      return (
        (secondClassroom.memberCount ?? -1) - (firstClassroom.memberCount ?? -1) ||
        firstClassroom.name.localeCompare(secondClassroom.name, "vi")
      );
    }

    if (sortOption === "members-asc") {
      return (
        (firstClassroom.memberCount ?? Number.MAX_SAFE_INTEGER) -
          (secondClassroom.memberCount ?? Number.MAX_SAFE_INTEGER) ||
        firstClassroom.name.localeCompare(secondClassroom.name, "vi")
      );
    }

    return firstClassroom.name.localeCompare(secondClassroom.name, "vi");
  });
}
