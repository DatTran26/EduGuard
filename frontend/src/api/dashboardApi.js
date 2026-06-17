import { antiCheatApi } from "./antiCheatApi";
import { assignmentApi } from "./assignmentApi";
import { areUserIdsEqual, buildExamStatusLabel, getCurrentSessionUser } from "./apiHelpers";
import { classroomApi } from "./classroomApi";
import { examApi } from "./examApi";
import { examAttemptApi } from "./examAttemptApi";
import {
  buildApiResponse,
  createApiError,
  executeMockRequest,
  readMockDatabase,
  requireCurrentUser,
} from "./mockDatabase";

// INTEGRATION STATUS:
// - Teacher dashboard đã chuyển sang tổng hợp dữ liệu backend thật từ classroom / assignment / exam / attempt / anti-cheat API.
// - Admin và student dashboard hiện vẫn dùng mock vì backend chưa có dashboard endpoint và chưa đủ dữ liệu thật để suy ra trọn vẹn.

// Hàm này tính trung bình các số và làm tròn 1 chữ số thập phân để đưa lên dashboard cho dễ đọc.
function calculateAverage(values) {
  if (values.length === 0) {
    return 0;
  }

  const totalValue = values.reduce((sumValue, currentValue) => sumValue + currentValue, 0);
  return Math.round((totalValue / values.length) * 10) / 10;
}

// Hàm này ép phần trăm về khoảng 0-100 để thanh tiến độ không bị vỡ layout.
function clampPercentage(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildLocalDateKey(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayMonthLabel(dateValue) {
  const date = new Date(dateValue);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${day}/${month}`;
}

// Hàm này lấy số sinh viên active trong một classroom để các phép tính submission và score dùng chung.
function getActiveStudentCount(database, classroomId) {
  return database.classroomMembers.filter(
    (member) => member.classroomId === classroomId && member.status === "Active",
  ).length;
}

// Hàm này lấy tên lớp học theo id để page không phải tự nối tay ở nhiều nơi.
function getClassroomNameById(database, classroomId) {
  const classroom = database.classrooms.find((item) => item.id === classroomId);
  return classroom?.name ?? "Lớp học chưa xác định";
}

// Hàm này lấy tên đề thi theo id để danh sách lịch thi và kết quả nhìn rõ hơn.
function getExamTitleById(database, examId) {
  const exam = database.exams.find((item) => item.id === examId);
  return exam?.title ?? "Bài kiểm tra chưa xác định";
}

// Hàm này gom các activity log mới nhất và thêm tên người thao tác để admin theo dõi.
function buildRecentActivities(database) {
  return database.activityLogs
    .slice()
    .sort((firstLog, secondLog) => {
      return new Date(secondLog.createdAt) - new Date(firstLog.createdAt);
    })
    .slice(0, 6)
    .map((logItem) => {
      const actor = database.users.find((user) => areUserIdsEqual(user.id, logItem.userId));

      return {
        id: logItem.id,
        action: logItem.action,
        actorName: actor?.fullName ?? "Hệ thống",
        description: logItem.description,
        createdAt: logItem.createdAt,
      };
    });
}

// Hàm này tổng hợp classroom cho admin để biết lớp nào đông thành viên và có nhiều bài thi hơn.
function buildAdminClassroomOverview(database) {
  return database.classrooms
    .map((classroom) => {
      const memberCount = getActiveStudentCount(database, classroom.id) + 1;
      const examCount = database.exams.filter((exam) => exam.classroomId === classroom.id).length;
      const assignmentCount = database.assignments.filter(
        (assignment) => assignment.classroomId === classroom.id,
      ).length;

      return {
        id: classroom.id,
        name: classroom.name,
        memberCount,
        examCount,
        assignmentCount,
      };
    })
    .sort((firstClassroom, secondClassroom) => secondClassroom.memberCount - firstClassroom.memberCount);
}

// Hàm này gom phân bố role để admin dashboard có dữ liệu dạng biểu đồ thanh.
function buildRoleDistribution(database) {
  const roleLabels = [
    { role: "Admin", label: "Quản trị viên" },
    { role: "Teacher", label: "Giảng viên" },
    { role: "Student", label: "Sinh viên" },
  ];

  return roleLabels.map((item) => {
    const count = database.users.filter((user) => user.role === item.role).length;
    return {
      label: item.label,
      value: count,
      percentage: clampPercentage((count / Math.max(database.users.length, 1)) * 100),
    };
  });
}

// Hàm này tổng hợp cheating log theo loại để teacher/admin nhìn nhanh nhóm hành vi nổi bật.
function buildCheatingTypeBreakdown(database, examIds = null) {
  const relevantAttemptIds = examIds
    ? database.examAttempts
        .filter((attempt) => examIds.includes(attempt.examId))
        .map((attempt) => attempt.id)
    : null;

  const relevantLogs = database.cheatingLogs.filter((logItem) =>
    relevantAttemptIds ? relevantAttemptIds.includes(logItem.examAttemptId) : true,
  );

  const groupedLogs = relevantLogs.reduce((accumulator, logItem) => {
    const previousValue = accumulator[logItem.type] ?? 0;
    accumulator[logItem.type] = previousValue + 1;
    return accumulator;
  }, {});

  const maxCount = Math.max(1, ...Object.values(groupedLogs));

  return Object.entries(groupedLogs)
    .map(([type, count]) => ({
      label: type,
      value: count,
      percentage: clampPercentage((count / maxCount) * 100),
    }))
    .sort((firstItem, secondItem) => secondItem.value - firstItem.value);
}

// Hàm này dựng dữ liệu dashboard cho admin từ toàn bộ mock database hiện có.
function buildAdminDashboardData(database) {
  const studentCount = database.users.filter((user) => user.role === "Student").length;
  const teacherCount = database.users.filter((user) => user.role === "Teacher").length;
  const totalSuspicionPoints = database.examAttempts.reduce(
    (sumValue, attempt) => sumValue + (attempt.suspicionScore ?? 0),
    0,
  );

  return {
    summary: {
      totalUsers: database.users.length,
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      totalClassrooms: database.classrooms.length,
      totalExams: database.exams.length,
      totalAttempts: database.examAttempts.length,
      totalSuspicionPoints,
    },
    roleDistribution: buildRoleDistribution(database),
    classroomOverview: buildAdminClassroomOverview(database),
    recentActivities: buildRecentActivities(database),
    cheatingTypes: buildCheatingTypeBreakdown(database),
  };
}

// Hàm này tính tỷ lệ nộp bài trung bình của teacher dựa trên assignment và số sinh viên mỗi lớp.
function calculateTeacherSubmissionRate(database, teacherAssignments) {
  if (teacherAssignments.length === 0) {
    return 0;
  }

  const assignmentRates = teacherAssignments.map((assignment) => {
    const studentCount = getActiveStudentCount(database, assignment.classroomId);
    const submissionCount = database.submissions.filter(
      (submission) => submission.assignmentId === assignment.id,
    ).length;

    if (studentCount === 0) {
      return 0;
    }

    return (submissionCount / studentCount) * 100;
  });

  return clampPercentage(calculateAverage(assignmentRates));
}

// Hàm này gom danh sách sinh viên rủi ro cao theo suspicion score để teacher xử lý nhanh.
function buildHighRiskStudents(database, teacherExamIds) {
  const riskyAttempts = database.examAttempts.filter(
    (attempt) => teacherExamIds.includes(attempt.examId) && (attempt.suspicionScore ?? 0) > 0,
  );

  const groupedStudents = riskyAttempts.reduce((accumulator, attempt) => {
    const previousValue = accumulator[attempt.studentId] ?? {
      studentId: attempt.studentId,
      totalSuspicion: 0,
      attemptCount: 0,
      latestExamId: attempt.examId,
    };

    previousValue.totalSuspicion += attempt.suspicionScore ?? 0;
    previousValue.attemptCount += 1;
    previousValue.latestExamId = attempt.examId;
    accumulator[attempt.studentId] = previousValue;
    return accumulator;
  }, {});

  return Object.values(groupedStudents)
    .map((studentRiskItem) => {
      const student = database.users.find((user) => areUserIdsEqual(user.id, studentRiskItem.studentId));

      return {
        id: studentRiskItem.studentId,
        studentName: student?.fullName ?? "Sinh viên chưa xác định",
        email: student?.email ?? "--",
        totalSuspicion: studentRiskItem.totalSuspicion,
        attemptCount: studentRiskItem.attemptCount,
        latestExamTitle: getExamTitleById(database, studentRiskItem.latestExamId),
      };
    })
    .sort((firstItem, secondItem) => secondItem.totalSuspicion - firstItem.totalSuspicion)
    .slice(0, 5);
}

// Hàm này dựng hiệu suất theo từng classroom để teacher dashboard nhìn được lớp nào đang chậm tiến độ.
function buildTeacherClassroomPerformance(database, managedClassrooms) {
  return managedClassrooms.map((classroom) => {
    const classroomAssignments = database.assignments.filter(
      (assignment) => assignment.classroomId === classroom.id,
    );
    const classroomExams = database.exams.filter((exam) => exam.classroomId === classroom.id);
    const classroomAttempts = database.examAttempts.filter((attempt) =>
      classroomExams.some((exam) => exam.id === attempt.examId),
    );
    const classroomScores = classroomAttempts
      .map((attempt) => attempt.score)
      .filter((scoreValue) => typeof scoreValue === "number");
    const memberCount = getActiveStudentCount(database, classroom.id);
    const expectedSubmissionCount = classroomAssignments.length * Math.max(memberCount, 1);
    const realSubmissionCount = database.submissions.filter((submission) =>
      classroomAssignments.some((assignment) => assignment.id === submission.assignmentId),
    ).length;

    return {
      id: classroom.id,
      name: classroom.name,
      studentCount: memberCount,
      assignmentCount: classroomAssignments.length,
      averageScore: calculateAverage(classroomScores),
      submissionRate:
        expectedSubmissionCount === 0
          ? 0
          : clampPercentage((realSubmissionCount / expectedSubmissionCount) * 100),
      riskCount: classroomAttempts.filter((attempt) => (attempt.suspicionScore ?? 0) >= 10).length,
    };
  });
}

// Hàm này gom hoạt động 7 ngày gần nhất để chart đường nhìn được nhịp nộp bài và cảnh báo bất thường.
function buildTeacherActivityTrend(database, teacherExamIds) {
  const relevantAttempts = database.examAttempts.filter((attempt) => teacherExamIds.includes(attempt.examId));
  const relevantAttemptIds = new Set(relevantAttempts.map((attempt) => attempt.id));
  const attemptsByDay = relevantAttempts.reduce((accumulator, attempt) => {
    const dayKey = buildLocalDateKey(attempt.submittedAt ?? attempt.startedAt ?? new Date());
    accumulator[dayKey] = (accumulator[dayKey] ?? 0) + 1;
    return accumulator;
  }, {});
  const alertsByDay = database.cheatingLogs
    .filter((logItem) => relevantAttemptIds.has(logItem.examAttemptId))
    .reduce((accumulator, logItem) => {
      const dayKey = buildLocalDateKey(logItem.occurredAt ?? new Date());
      accumulator[dayKey] = (accumulator[dayKey] ?? 0) + 1;
      return accumulator;
    }, {});
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date(today);

    currentDate.setDate(today.getDate() - (6 - index));

    const dayKey = buildLocalDateKey(currentDate);

    return {
      label: formatDayMonthLabel(currentDate),
      attemptCount: attemptsByDay[dayKey] ?? 0,
      alertCount: alertsByDay[dayKey] ?? 0,
    };
  });
}

// Hàm này phân nhóm đề thi theo trạng thái để donut chart cho teacher đọc nhanh ngay đầu dashboard.
function buildTeacherExamStatusBreakdown(teacherExams) {
  const orderedLabels = ["Bản nháp", "Sắp mở", "Đang mở", "Đã đóng"];
  const groupedStatuses = teacherExams.reduce((accumulator, exam) => {
    const statusLabel = buildExamStatusLabel(exam);

    accumulator[statusLabel] = (accumulator[statusLabel] ?? 0) + 1;
    return accumulator;
  }, {});
  const orderedStatusLabels = [
    ...orderedLabels,
    ...Object.keys(groupedStatuses).filter((label) => !orderedLabels.includes(label)),
  ];
  const totalExamCount = teacherExams.length;

  return orderedStatusLabels.map((label) => ({
    label,
    value: groupedStatuses[label] ?? 0,
    percentage:
      totalExamCount === 0 ? 0 : clampPercentage(((groupedStatuses[label] ?? 0) / totalExamCount) * 100),
  }));
}

function buildItemPreview(items, key) {
  return items
    .slice(0, 2)
    .map((item) => item[key])
    .filter(Boolean)
    .join(", ");
}

// Hàm này gom vài việc cần xử lý để phần dashboard của giảng viên có khối hành động rõ ràng.
function buildTeacherActionItems(teacherExams, classroomPerformance, highRiskStudents) {
  const actionItems = [];
  const draftExams = teacherExams.filter((exam) => buildExamStatusLabel(exam) === "Bản nháp");
  const upcomingExams = teacherExams.filter((exam) => buildExamStatusLabel(exam) === "Sắp mở");
  const lowSubmissionClasses = classroomPerformance.filter((classroom) => classroom.submissionRate < 60);
  const weakScoreClasses = classroomPerformance.filter(
    (classroom) => classroom.averageScore > 0 && classroom.averageScore < 7,
  );

  if (draftExams.length > 0) {
    actionItems.push({
      id: "draft-exams",
      tone: "neutral",
      title: `${draftExams.length} bài kiểm tra vẫn đang ở bản nháp`,
      detail: "Kiểm tra nội dung và publish khi đã sẵn sàng cho sinh viên.",
    });
  }

  if (upcomingExams.length > 0) {
    actionItems.push({
      id: "upcoming-exams",
      tone: "info",
      title: `${upcomingExams.length} bài kiểm tra sắp diễn ra`,
      detail: "Rà soát lại thời gian mở đề và cấu hình trước giờ bắt đầu.",
    });
  }

  if (lowSubmissionClasses.length > 0) {
    actionItems.push({
      id: "low-submission",
      tone: "caution",
      title: `${lowSubmissionClasses.length} lớp có tỉ lệ nộp bài thấp`,
      detail: `Cần nhắc thêm ở: ${buildItemPreview(lowSubmissionClasses, "name") || "các lớp liên quan"}.`,
    });
  }

  if (weakScoreClasses.length > 0) {
    actionItems.push({
      id: "weak-score",
      tone: "danger",
      title: `${weakScoreClasses.length} lớp có điểm thi trung bình dưới 7`,
      detail: "Nên xem lại độ khó đề hoặc bổ sung nội dung ôn tập.",
    });
  }

  if (highRiskStudents.length > 0) {
    actionItems.push({
      id: "high-risk-students",
      tone: "danger",
      title: `${highRiskStudents.length} sinh viên cần theo dõi thêm`,
      detail: "Ưu tiên các trường hợp có điểm nghi ngờ cao để rà soát chi tiết.",
    });
  }

  if (actionItems.length === 0) {
    return [
      {
        id: "all-clear",
        tone: "success",
        title: "Chưa có hạng mục nào cần xử lý gấp",
        detail: "Các lớp học và bài kiểm tra hiện đang ở trạng thái ổn định.",
      },
    ];
  }

  return actionItems.slice(0, 4);
}

// Hàm này dựng danh sách lịch thi sắp tới của giảng viên để nhìn nhanh công việc gần hạn.
function buildTeacherUpcomingExams(database, teacherExams) {
  return teacherExams
    .filter((exam) => new Date(exam.startTime).getTime() > Date.now())
    .sort((firstExam, secondExam) => new Date(firstExam.startTime) - new Date(secondExam.startTime))
    .slice(0, 5)
    .map((exam) => ({
      id: exam.id,
      title: exam.title,
      classroomName: getClassroomNameById(database, exam.classroomId),
      startTime: exam.startTime,
      durationMinutes: exam.durationMinutes,
      enableAntiCheat: exam.enableAntiCheat,
    }));
}

function getMapValuesAsArray(itemsByKey) {
  return [...itemsByKey.values()].flat();
}

function buildTeacherSubmissionRateFromReal(assignmentsByClassroom, membersByClassroom) {
  const assignmentRates = [...assignmentsByClassroom.entries()].flatMap(([classroomId, assignments]) => {
    const studentCount = (membersByClassroom.get(classroomId) ?? []).length;

    return assignments.map((assignment) => {
      if (studentCount === 0) {
        return 0;
      }

      return (Number(assignment.submissionCount) || 0) / studentCount * 100;
    });
  });

  if (assignmentRates.length === 0) {
    return 0;
  }

  return clampPercentage(calculateAverage(assignmentRates));
}

function buildTeacherActivityTrendFromReal(teacherAttempts, antiCheatLogs) {
  const attemptsByDay = teacherAttempts.reduce((accumulator, attempt) => {
    const rawDateValue = attempt.submittedAt || attempt.startedAt;

    if (!rawDateValue) {
      return accumulator;
    }

    const dayKey = buildLocalDateKey(rawDateValue);

    accumulator[dayKey] = (accumulator[dayKey] ?? 0) + 1;
    return accumulator;
  }, {});
  const alertsByDay = antiCheatLogs.reduce((accumulator, logItem) => {
    if (!logItem.occurredAt) {
      return accumulator;
    }

    const dayKey = buildLocalDateKey(logItem.occurredAt);

    accumulator[dayKey] = (accumulator[dayKey] ?? 0) + 1;
    return accumulator;
  }, {});
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date(today);

    currentDate.setDate(today.getDate() - (6 - index));

    const dayKey = buildLocalDateKey(currentDate);

    return {
      label: formatDayMonthLabel(currentDate),
      attemptCount: attemptsByDay[dayKey] ?? 0,
      alertCount: alertsByDay[dayKey] ?? 0,
    };
  });
}

function buildCheatingTypeBreakdownFromReal(antiCheatLogs) {
  if (antiCheatLogs.length === 0) {
    return [];
  }

  const groupedLogs = antiCheatLogs.reduce((accumulator, logItem) => {
    const previousValue = accumulator[logItem.type] ?? 0;

    accumulator[logItem.type] = previousValue + 1;
    return accumulator;
  }, {});
  const totalLogs = antiCheatLogs.length;

  return Object.entries(groupedLogs)
    .map(([type, count]) => ({
      label: type,
      value: count,
      percentage: clampPercentage((count / totalLogs) * 100),
    }))
    .sort((firstItem, secondItem) => secondItem.value - firstItem.value);
}

function buildTeacherClassroomPerformanceFromReal(
  managedClassrooms,
  assignmentsByClassroom,
  membersByClassroom,
  examsByClassroom,
  attemptsByExam,
) {
  return managedClassrooms.map((classroom) => {
    const classroomAssignments = assignmentsByClassroom.get(classroom.id) ?? [];
    const classroomMembers = membersByClassroom.get(classroom.id) ?? [];
    const classroomExams = examsByClassroom.get(classroom.id) ?? [];
    const classroomAttempts = classroomExams.flatMap((exam) => attemptsByExam.get(exam.id) ?? []);
    const classroomScores = classroomAttempts
      .map((attempt) => attempt.score)
      .filter((scoreValue) => typeof scoreValue === "number");
    const studentCount = classroomMembers.length;
    const expectedSubmissionCount = classroomAssignments.length * studentCount;
    const actualSubmissionCount = classroomAssignments.reduce(
      (sumValue, assignment) => sumValue + (Number(assignment.submissionCount) || 0),
      0,
    );

    return {
      id: classroom.id,
      name: classroom.name,
      studentCount,
      assignmentCount: classroomAssignments.length,
      averageScore: calculateAverage(classroomScores),
      submissionRate:
        expectedSubmissionCount === 0
          ? 0
          : clampPercentage((actualSubmissionCount / expectedSubmissionCount) * 100),
      riskCount: classroomAttempts.filter((attempt) => Number(attempt.suspicionScore) >= 10).length,
    };
  });
}

function buildTeacherHighRiskStudentsFromReal(teacherAttempts, examsById, studentsById) {
  const riskyAttempts = teacherAttempts.filter((attempt) => Number(attempt.suspicionScore) > 0);
  const groupedStudents = riskyAttempts.reduce((accumulator, attempt) => {
    const studentId = String(attempt.studentId || "");

    if (!studentId) {
      return accumulator;
    }

    const attemptTimestamp = new Date(attempt.submittedAt || attempt.startedAt || 0).getTime();
    const previousValue = accumulator[studentId] ?? {
      studentId,
      studentName: attempt.studentName ?? "",
      totalSuspicion: 0,
      attemptCount: 0,
      latestAttemptTimestamp: Number.NEGATIVE_INFINITY,
      latestExamId: Number(attempt.examId) || 0,
    };

    previousValue.totalSuspicion += Number(attempt.suspicionScore) || 0;
    previousValue.attemptCount += 1;

    if (attemptTimestamp >= previousValue.latestAttemptTimestamp) {
      previousValue.latestAttemptTimestamp = attemptTimestamp;
      previousValue.latestExamId = Number(attempt.examId) || 0;
      previousValue.studentName = attempt.studentName || previousValue.studentName;
    }

    accumulator[studentId] = previousValue;
    return accumulator;
  }, {});

  return Object.values(groupedStudents)
    .map((studentRiskItem) => {
      const student = studentsById.get(studentRiskItem.studentId);

      return {
        id: studentRiskItem.studentId,
        studentName:
          studentRiskItem.studentName ||
          student?.fullName ||
          "Sinh viên chưa xác định",
        email: student?.email ?? "--",
        totalSuspicion: studentRiskItem.totalSuspicion,
        attemptCount: studentRiskItem.attemptCount,
        latestExamTitle:
          examsById.get(studentRiskItem.latestExamId)?.title ?? "Bài kiểm tra chưa xác định",
      };
    })
    .sort((firstItem, secondItem) => secondItem.totalSuspicion - firstItem.totalSuspicion)
    .slice(0, 5);
}

function buildTeacherUpcomingExamsFromReal(teacherExams) {
  return teacherExams
    .filter((exam) => exam.startTime && new Date(exam.startTime).getTime() > Date.now())
    .sort((firstExam, secondExam) => new Date(firstExam.startTime) - new Date(secondExam.startTime))
    .slice(0, 5)
    .map((exam) => ({
      id: exam.id,
      title: exam.title,
      classroomName: exam.classroomName,
      startTime: exam.startTime,
      durationMinutes: exam.durationMinutes,
      enableAntiCheat: exam.enableAntiCheat,
    }));
}

async function buildTeacherDashboardDataFromRealApis() {
  const classroomResponse = await classroomApi.getAll();
  const managedClassrooms = Array.isArray(classroomResponse.data)
    ? classroomResponse.data.filter((classroom) => classroom.canEdit)
    : [];
  const managedClassroomIds = new Set(managedClassrooms.map((classroom) => classroom.id));
  const [memberEntries, assignmentEntries, examResponse] = await Promise.all([
    Promise.all(
      managedClassrooms.map(async (classroom) => {
        try {
          const response = await classroomApi.getMembers(classroom.id);
          return [classroom.id, Array.isArray(response.data) ? response.data : []];
        } catch {
          return [classroom.id, []];
        }
      }),
    ),
    Promise.all(
      managedClassrooms.map(async (classroom) => {
        try {
          const response = await assignmentApi.getByClassroom(classroom.id);
          return [classroom.id, Array.isArray(response.data) ? response.data : []];
        } catch {
          return [classroom.id, []];
        }
      }),
    ),
    examApi.getAll(),
  ]);
  const teacherExams = (Array.isArray(examResponse.data) ? examResponse.data : []).filter((exam) =>
    managedClassroomIds.has(Number(exam.classroomId)),
  );
  const attemptEntries = await Promise.all(
    teacherExams.map(async (exam) => {
      try {
        const response = await examAttemptApi.getByExam(exam.id);
        return [exam.id, Array.isArray(response.data) ? response.data : []];
      } catch {
        return [exam.id, []];
      }
    }),
  );
  const suspiciousAttempts = attemptEntries
    .flatMap(([, attempts]) => attempts)
    .filter((attempt) => Number(attempt.suspicionScore) > 0);
  const antiCheatLogEntries = await Promise.all(
    suspiciousAttempts.map(async (attempt) => {
      try {
        const response = await antiCheatApi.getLogsByAttempt(attempt.id);
        return [attempt.id, Array.isArray(response.data) ? response.data : []];
      } catch {
        return [attempt.id, []];
      }
    }),
  );
  const membersByClassroom = new Map(memberEntries.map(([classroomId, members]) => [Number(classroomId), members]));
  const assignmentsByClassroom = new Map(
    assignmentEntries.map(([classroomId, assignments]) => [Number(classroomId), assignments]),
  );
  const examsByClassroom = teacherExams.reduce((accumulator, exam) => {
    const classroomId = Number(exam.classroomId) || 0;
    const previousValue = accumulator.get(classroomId) ?? [];

    previousValue.push(exam);
    accumulator.set(classroomId, previousValue);
    return accumulator;
  }, new Map());
  const attemptsByExam = new Map(attemptEntries.map(([examId, attempts]) => [Number(examId), attempts]));
  const allTeacherAttempts = getMapValuesAsArray(attemptsByExam);
  const allAntiCheatLogs = antiCheatLogEntries.flatMap(([, logs]) => logs);
  const studentsById = memberEntries.reduce((accumulator, [, members]) => {
    members.forEach((member) => {
      const studentId = String(member.studentId || "");

      if (studentId) {
        accumulator.set(studentId, member);
      }
    });
    return accumulator;
  }, new Map());
  const uniqueStudentIds = new Set([...studentsById.keys()]);
  const examsById = new Map(teacherExams.map((exam) => [Number(exam.id), exam]));
  const classroomPerformance = buildTeacherClassroomPerformanceFromReal(
    managedClassrooms,
    assignmentsByClassroom,
    membersByClassroom,
    examsByClassroom,
    attemptsByExam,
  );
  const highRiskStudents = buildTeacherHighRiskStudentsFromReal(
    allTeacherAttempts,
    examsById,
    studentsById,
  );

  return {
    summary: {
      managedClassrooms: managedClassrooms.length,
      totalStudents: uniqueStudentIds.size,
      totalAssignments: getMapValuesAsArray(assignmentsByClassroom).length,
      totalExams: teacherExams.length,
      submissionRate: buildTeacherSubmissionRateFromReal(assignmentsByClassroom, membersByClassroom),
      averageExamScore: calculateAverage(
        allTeacherAttempts
          .map((attempt) => attempt.score)
          .filter((scoreValue) => typeof scoreValue === "number"),
      ),
    },
    activityTrend: buildTeacherActivityTrendFromReal(allTeacherAttempts, allAntiCheatLogs),
    examStatusBreakdown: buildTeacherExamStatusBreakdown(teacherExams),
    classroomPerformance,
    actionItems: buildTeacherActionItems(teacherExams, classroomPerformance, highRiskStudents),
    highRiskStudents,
    upcomingExams: buildTeacherUpcomingExamsFromReal(teacherExams),
    cheatingTypes: buildCheatingTypeBreakdownFromReal(allAntiCheatLogs),
  };
}

// Hàm này dựng dashboard cho teacher bằng cách lọc các bảng thuộc quyền của giảng viên hiện tại.
function buildTeacherDashboardData(database, currentUser) {
  const managedClassrooms = database.classrooms.filter(
    (classroom) => areUserIdsEqual(classroom.teacherId, currentUser.id),
  );
  const classroomIds = managedClassrooms.map((classroom) => classroom.id);
  const teacherAssignments = database.assignments.filter(
    (assignment) => areUserIdsEqual(assignment.teacherId, currentUser.id),
  );
  const teacherExams = database.exams.filter((exam) => areUserIdsEqual(exam.teacherId, currentUser.id));
  const teacherExamIds = teacherExams.map((exam) => exam.id);
  const teacherAttempts = database.examAttempts.filter((attempt) => teacherExamIds.includes(attempt.examId));
  const studentIds = [
    ...new Set(
      database.classroomMembers
        .filter((member) => classroomIds.includes(member.classroomId) && member.status === "Active")
        .map((member) => member.studentId),
    ),
  ];
  const attemptScores = teacherAttempts
    .map((attempt) => attempt.score)
    .filter((scoreValue) => typeof scoreValue === "number");
  const classroomPerformance = buildTeacherClassroomPerformance(database, managedClassrooms);
  const highRiskStudents = buildHighRiskStudents(database, teacherExamIds);

  return {
    summary: {
      managedClassrooms: managedClassrooms.length,
      totalStudents: studentIds.length,
      totalAssignments: teacherAssignments.length,
      totalExams: teacherExams.length,
      submissionRate: calculateTeacherSubmissionRate(database, teacherAssignments),
      averageExamScore: calculateAverage(attemptScores),
    },
    activityTrend: buildTeacherActivityTrend(database, teacherExamIds),
    examStatusBreakdown: buildTeacherExamStatusBreakdown(teacherExams),
    classroomPerformance,
    actionItems: buildTeacherActionItems(teacherExams, classroomPerformance, highRiskStudents),
    highRiskStudents,
    upcomingExams: buildTeacherUpcomingExams(database, teacherExams),
    cheatingTypes: buildCheatingTypeBreakdown(database, teacherExamIds),
  };
}

// Hàm này dựng các việc sắp tới của student từ assignment và exam trong các lớp đã tham gia.
function buildStudentUpcomingItems(database, joinedClassIds) {
  const upcomingAssignments = database.assignments
    .filter(
      (assignment) =>
        joinedClassIds.includes(assignment.classroomId) &&
        new Date(assignment.deadline).getTime() > Date.now(),
    )
    .map((assignment) => ({
      id: `assignment-${assignment.id}`,
      type: "Bài tập",
      title: assignment.title,
      classroomName: getClassroomNameById(database, assignment.classroomId),
      date: assignment.deadline,
    }));

  const upcomingExams = database.exams
    .filter(
      (exam) =>
        joinedClassIds.includes(exam.classroomId) &&
        exam.isPublished &&
        new Date(exam.startTime).getTime() > Date.now(),
    )
    .map((exam) => ({
      id: `exam-${exam.id}`,
      type: "Bài kiểm tra",
      title: exam.title,
      classroomName: getClassroomNameById(database, exam.classroomId),
      date: exam.startTime,
    }));

  return [...upcomingAssignments, ...upcomingExams]
    .sort((firstItem, secondItem) => new Date(firstItem.date) - new Date(secondItem.date))
    .slice(0, 6);
}

// Hàm này dựng bảng tiến độ theo lớp cho student để bạn dễ nhìn lớp nào đang còn nhiều việc.
function buildStudentClassProgress(database, currentUser, joinedClassrooms) {
  return joinedClassrooms.map((classroom) => {
    const classroomAssignments = database.assignments.filter(
      (assignment) => assignment.classroomId === classroom.id,
    );
    const submissionCount = database.submissions.filter(
      (submission) =>
        areUserIdsEqual(submission.studentId, currentUser.id) &&
        classroomAssignments.some((assignment) => assignment.id === submission.assignmentId),
    ).length;
    const classroomExams = database.exams.filter((exam) => exam.classroomId === classroom.id);
    const attemptScores = database.examAttempts
      .filter(
        (attempt) =>
          areUserIdsEqual(attempt.studentId, currentUser.id) &&
          classroomExams.some((exam) => exam.id === attempt.examId) &&
          typeof attempt.score === "number",
      )
      .map((attempt) => attempt.score);

    return {
      id: classroom.id,
      name: classroom.name,
      submissionProgress:
        classroomAssignments.length === 0
          ? 0
          : clampPercentage((submissionCount / classroomAssignments.length) * 100),
      assignmentCount: classroomAssignments.length,
      submissionCount,
      averageScore: calculateAverage(attemptScores),
    };
  });
}

// Hàm này gom kết quả gần đây của student để dashboard có khu vực theo dõi điểm số.
function buildStudentRecentResults(database, currentUser) {
  return database.examAttempts
    .filter((attempt) => areUserIdsEqual(attempt.studentId, currentUser.id) && typeof attempt.score === "number")
    .sort((firstAttempt, secondAttempt) => {
      return new Date(secondAttempt.submittedAt) - new Date(firstAttempt.submittedAt);
    })
    .slice(0, 5)
    .map((attempt) => {
      const exam = database.exams.find((examItem) => examItem.id === attempt.examId);

      return {
        id: attempt.id,
        title: exam?.title ?? "Bài kiểm tra chưa xác định",
        classroomName: exam ? getClassroomNameById(database, exam.classroomId) : "Chưa xác định",
        score: attempt.score,
        suspicionScore: attempt.suspicionScore ?? 0,
        submittedAt: attempt.submittedAt,
      };
    });
}

// Hàm này dựng dashboard cho student từ các lớp đã tham gia, bài tập chưa nộp và kết quả thi.
function buildStudentDashboardData(database, currentUser) {
  const joinedMemberships = database.classroomMembers.filter(
    (member) => areUserIdsEqual(member.studentId, currentUser.id) && member.status === "Active",
  );
  const joinedClassIds = joinedMemberships.map((member) => member.classroomId);
  const joinedClassrooms = database.classrooms.filter((classroom) => joinedClassIds.includes(classroom.id));
  const studentAssignments = database.assignments.filter((assignment) =>
    joinedClassIds.includes(assignment.classroomId),
  );
  const studentSubmissions = database.submissions.filter(
    (submission) => areUserIdsEqual(submission.studentId, currentUser.id),
  );
  const studentExamAttempts = database.examAttempts.filter((attempt) =>
    areUserIdsEqual(attempt.studentId, currentUser.id),
  );
  const scoredAttempts = studentExamAttempts
    .map((attempt) => attempt.score)
    .filter((scoreValue) => typeof scoreValue === "number");
  const pendingAssignments = studentAssignments.filter(
    (assignment) => !studentSubmissions.some((submission) => submission.assignmentId === assignment.id),
  );

  return {
    summary: {
      joinedClassrooms: joinedClassrooms.length,
      pendingAssignments: pendingAssignments.length,
      completedAssignments: studentSubmissions.length,
      averageExamScore: calculateAverage(scoredAttempts),
      upcomingItems: buildStudentUpcomingItems(database, joinedClassIds).length,
      warningCount: studentExamAttempts.filter((attempt) => (attempt.suspicionScore ?? 0) >= 10).length,
    },
    classProgress: buildStudentClassProgress(database, currentUser, joinedClassrooms),
    upcomingItems: buildStudentUpcomingItems(database, joinedClassIds),
    recentResults: buildStudentRecentResults(database, currentUser),
    notifications: database.notifications
      .filter((notification) => areUserIdsEqual(notification.userId, currentUser.id))
      .sort((firstNotification, secondNotification) => {
        return new Date(secondNotification.createdAt) - new Date(firstNotification.createdAt);
      })
      .slice(0, 5),
  };
}

// DASHBOARD ENDPOINT GROUP:
// - getTeacherDashboard đang tổng hợp từ API thật của backend.
// - getAdminDashboard và getStudentDashboard vẫn là mock endpoint theo role.
export const dashboardApi = {
  getAdminDashboard() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);

      if (currentUser.role !== "Admin") {
        throw createApiError("Chỉ quản trị viên mới có quyền xem dashboard này.", 403);
      }

      return buildApiResponse({
        message: "Lấy dữ liệu dashboard admin thành công.",
        data: buildAdminDashboardData(database),
      });
    });
  },

  async getTeacherDashboard() {
    const currentUser = getCurrentSessionUser();

    if (!currentUser) {
      throw createApiError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
    }

    if (currentUser.role !== "Teacher") {
      throw createApiError("Chỉ giảng viên mới có quyền xem dashboard này.", 403);
    }

    return buildApiResponse({
      message: "Lấy dữ liệu dashboard giảng viên thành công.",
      data: await buildTeacherDashboardDataFromRealApis(),
    });
  },

  getStudentDashboard() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);

      if (currentUser.role !== "Student") {
        throw createApiError("Chỉ sinh viên mới có quyền xem dashboard này.", 403);
      }

      return buildApiResponse({
        message: "Lấy dữ liệu dashboard sinh viên thành công.",
        data: buildStudentDashboardData(database, currentUser),
      });
    });
  },
};
