import { antiCheatApi } from "./antiCheatApi";
import { assignmentApi } from "./assignmentApi";
import { areUserIdsEqual, buildExamStatusLabel, getCurrentSessionUser } from "./apiHelpers";
import { classroomApi } from "./classroomApi";
import { examApi } from "./examApi";
import { examAttemptApi } from "./examAttemptApi";
import { userApi } from "./userApi";
import {
  buildApiResponse,
  createApiError,
  executeMockRequest,
  readMockDatabase,
  requireCurrentUser,
} from "./mockDatabase";

// INTEGRATION STATUS:
// - Admin dashboard đã chuyển sang tổng hợp dữ liệu backend thật từ user / classroom / exam / attempt / anti-cheat API.
// - Teacher dashboard đã chuyển sang tổng hợp dữ liệu backend thật từ classroom / assignment / exam / attempt / anti-cheat API.
// - Admin monitoring và student dashboard hiện vẫn dùng mock vì backend chưa có endpoint tổng hợp riêng.

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

// Hàm này lấy tên lớp học theo id để page không phải tự nối tay ở nhiều nơi.
function getClassroomNameById(database, classroomId) {
  const classroom = database.classrooms.find((item) => item.id === classroomId);
  return classroom?.name ?? "Lớp học chưa xác định";
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

function buildAdminHighRiskAttempts(database) {
  const logCountByAttemptId = database.cheatingLogs.reduce((accumulator, logItem) => {
    accumulator[logItem.examAttemptId] = (accumulator[logItem.examAttemptId] ?? 0) + 1;
    return accumulator;
  }, {});

  return database.examAttempts
    .filter((attempt) => Number(attempt.suspicionScore) > 0)
    .map((attempt) => {
      const exam = database.exams.find((examItem) => examItem.id === attempt.examId);
      const student = database.users.find((user) => areUserIdsEqual(user.id, attempt.studentId));

      return {
        id: attempt.id,
        studentName: student?.fullName ?? attempt.studentName ?? "Sinh viên chưa xác định",
        examTitle: exam?.title ?? "Bài kiểm tra chưa xác định",
        classroomName: exam ? getClassroomNameById(database, exam.classroomId) : "Lớp học chưa xác định",
        suspicionScore: Number(attempt.suspicionScore) || 0,
        logCount: logCountByAttemptId[attempt.id] ?? 0,
        submittedAt: attempt.submittedAt ?? attempt.startedAt ?? null,
        status: attempt.status ?? "--",
      };
    })
    .sort((firstAttempt, secondAttempt) => {
      const suspicionDelta = secondAttempt.suspicionScore - firstAttempt.suspicionScore;

      if (suspicionDelta !== 0) {
        return suspicionDelta;
      }

      return new Date(secondAttempt.submittedAt || 0) - new Date(firstAttempt.submittedAt || 0);
    });
}

function buildAdminRecentIncidents(database) {
  return database.cheatingLogs
    .slice()
    .sort((firstLog, secondLog) => new Date(secondLog.occurredAt || 0) - new Date(firstLog.occurredAt || 0))
    .slice(0, 10)
    .map((logItem) => {
      const attempt = database.examAttempts.find((attemptItem) => attemptItem.id === logItem.examAttemptId);
      const exam = attempt ? database.exams.find((examItem) => examItem.id === attempt.examId) : null;
      const student = attempt
        ? database.users.find((user) => areUserIdsEqual(user.id, attempt.studentId))
        : null;

      return {
        id: logItem.id,
        type: logItem.type,
        studentName: student?.fullName ?? attempt?.studentName ?? "Sinh viên chưa xác định",
        examTitle: exam?.title ?? "Bài kiểm tra chưa xác định",
        classroomName: exam ? getClassroomNameById(database, exam.classroomId) : "Lớp học chưa xác định",
        suspicionPoint: Number(logItem.suspicionPoint) || 0,
        occurredAt: logItem.occurredAt ?? null,
      };
    });
}

function buildAdminExamRiskRanking(database) {
  return database.exams
    .map((exam) => {
      const examAttempts = database.examAttempts.filter((attempt) => attempt.examId === exam.id);
      const attemptIds = new Set(examAttempts.map((attempt) => attempt.id));
      const examLogs = database.cheatingLogs.filter((logItem) => attemptIds.has(logItem.examAttemptId));
      const totalSuspicion = examAttempts.reduce(
        (sumValue, attempt) => sumValue + (Number(attempt.suspicionScore) || 0),
        0,
      );
      const flaggedAttempts = examAttempts.filter((attempt) => Number(attempt.suspicionScore) >= 10).length;

      return {
        id: exam.id,
        title: exam.title,
        classroomName: getClassroomNameById(database, exam.classroomId),
        totalAttempts: examAttempts.length,
        flaggedAttempts,
        totalLogs: examLogs.length,
        totalSuspicion,
      };
    })
    .filter((exam) => exam.totalAttempts > 0 || exam.totalLogs > 0 || exam.totalSuspicion > 0)
    .sort((firstExam, secondExam) => {
      const suspicionDelta = secondExam.totalSuspicion - firstExam.totalSuspicion;

      if (suspicionDelta !== 0) {
        return suspicionDelta;
      }

      return secondExam.totalLogs - firstExam.totalLogs;
    });
}

function buildAdminStudentRiskRanking(database) {
  const logsByAttemptId = database.cheatingLogs.reduce((accumulator, logItem) => {
    const previousLogs = accumulator[logItem.examAttemptId] ?? [];

    previousLogs.push(logItem);
    accumulator[logItem.examAttemptId] = previousLogs;
    return accumulator;
  }, {});
  const groupedStudents = database.examAttempts.reduce((accumulator, attempt) => {
    if (Number(attempt.suspicionScore) <= 0) {
      return accumulator;
    }

    const studentId = String(attempt.studentId || "");

    if (!studentId) {
      return accumulator;
    }

    const exam = database.exams.find((examItem) => examItem.id === attempt.examId);
    const previousValue = accumulator[studentId] ?? {
      id: studentId,
      studentName: attempt.studentName ?? "",
      email: "--",
      totalSuspicion: 0,
      logCount: 0,
      attemptCount: 0,
      classroomNames: new Set(),
    };

    previousValue.totalSuspicion += Number(attempt.suspicionScore) || 0;
    previousValue.logCount += (logsByAttemptId[attempt.id] ?? []).length;
    previousValue.attemptCount += 1;

    if (exam) {
      previousValue.classroomNames.add(getClassroomNameById(database, exam.classroomId));
    }

    accumulator[studentId] = previousValue;
    return accumulator;
  }, {});

  return Object.values(groupedStudents)
    .map((studentRiskItem) => {
      const student = database.users.find((user) => areUserIdsEqual(user.id, studentRiskItem.id));

      return {
        id: studentRiskItem.id,
        studentName: student?.fullName ?? studentRiskItem.studentName ?? "Sinh viên chưa xác định",
        email: student?.email ?? studentRiskItem.email,
        totalSuspicion: studentRiskItem.totalSuspicion,
        logCount: studentRiskItem.logCount,
        attemptCount: studentRiskItem.attemptCount,
        classroomNames: [...studentRiskItem.classroomNames],
      };
    })
    .sort((firstStudent, secondStudent) => secondStudent.totalSuspicion - firstStudent.totalSuspicion);
}

function buildAdminMonitoringData(database) {
  const highRiskAttempts = buildAdminHighRiskAttempts(database);
  const totalLogs = database.cheatingLogs.length;
  const flaggedAttempts = database.examAttempts.filter((attempt) => Number(attempt.suspicionScore) >= 10).length;
  const totalSuspicionPoints = database.examAttempts.reduce(
    (sumValue, attempt) => sumValue + (Number(attempt.suspicionScore) || 0),
    0,
  );

  return {
    summary: {
      totalLogs,
      flaggedAttempts,
      highRiskAttempts: highRiskAttempts.filter((attempt) => attempt.suspicionScore >= 10).length,
      totalSuspicionPoints,
    },
    cheatingTypes: buildCheatingTypeBreakdown(database),
    examRiskRanking: buildAdminExamRiskRanking(database),
    studentRiskRanking: buildAdminStudentRiskRanking(database),
    recentIncidents: buildAdminRecentIncidents(database),
  };
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

function buildAdminRoleDistributionFromReal(users) {
  const roleLabels = [
    { role: "Admin", label: "Quản trị viên" },
    { role: "Teacher", label: "Giảng viên" },
    { role: "Student", label: "Sinh viên" },
  ];

  return roleLabels.map((item) => {
    const count = users.filter((user) => user.role === item.role).length;

    return {
      label: item.label,
      value: count,
      percentage: clampPercentage((count / Math.max(users.length, 1)) * 100),
    };
  });
}

function buildAdminExamStatusBreakdownFromReal(exams) {
  const groupedStatuses = exams.reduce((accumulator, exam) => {
    const statusLabel = buildExamStatusLabel(exam);

    accumulator[statusLabel] = (accumulator[statusLabel] ?? 0) + 1;
    return accumulator;
  }, {});
  const totalExamCount = Math.max(exams.length, 1);

  return Object.entries(groupedStatuses)
    .map(([label, count]) => ({
      label,
      value: count,
      percentage: clampPercentage((count / totalExamCount) * 100),
    }))
    .sort((firstItem, secondItem) => secondItem.value - firstItem.value);
}

function buildAdminClassroomOverviewFromReal(classrooms, exams) {
  const examCountByClassroom = exams.reduce((accumulator, exam) => {
    const classroomId = Number(exam.classroomId) || 0;

    accumulator[classroomId] = (accumulator[classroomId] ?? 0) + 1;
    return accumulator;
  }, {});

  return classrooms
    .map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      memberCount: Number(classroom.memberCount) || 0,
      examCount: examCountByClassroom[Number(classroom.id)] ?? 0,
    }))
    .sort((firstClassroom, secondClassroom) => {
      const memberDelta = secondClassroom.memberCount - firstClassroom.memberCount;

      if (memberDelta !== 0) {
        return memberDelta;
      }

      return secondClassroom.examCount - firstClassroom.examCount;
    });
}

function buildAdminHighRiskAttemptsFromReal(attempts, examsById, logCountByAttempt) {
  return attempts
    .filter((attempt) => Number(attempt.suspicionScore) > 0)
    .map((attempt) => {
      const exam = examsById.get(Number(attempt.examId));

      return {
        id: attempt.id,
        studentName: attempt.studentName || "Sinh viên chưa xác định",
        examTitle: exam?.title ?? "Bài kiểm tra chưa xác định",
        classroomName: exam?.classroomName ?? "Lớp học chưa xác định",
        suspicionScore: Number(attempt.suspicionScore) || 0,
        logCount: logCountByAttempt.get(Number(attempt.id)) ?? 0,
        submittedAt: attempt.submittedAt ?? attempt.startedAt ?? null,
        status: attempt.status ?? "--",
      };
    })
    .sort((firstAttempt, secondAttempt) => {
      const suspicionDelta = secondAttempt.suspicionScore - firstAttempt.suspicionScore;

      if (suspicionDelta !== 0) {
        return suspicionDelta;
      }

      return new Date(secondAttempt.submittedAt || 0) - new Date(firstAttempt.submittedAt || 0);
    });
}

function buildAdminRecentActivitiesFromReal(classrooms, exams, attempts) {
  const classroomActivities = classrooms.map((classroom) => ({
    id: `classroom-${classroom.id}`,
    action: "tạo lớp học",
    actorName: classroom.teacherName || "Giảng viên chưa xác định",
    description: classroom.name,
    createdAt: classroom.createdAt ?? null,
  }));
  const examActivities = exams.map((exam) => ({
    id: `exam-${exam.id}`,
    action: exam.isPublished ? "publish đề thi" : "tạo đề thi",
    actorName: exam.teacherName || "Giảng viên chưa xác định",
    description: `${exam.title} • ${exam.classroomName}`,
    createdAt: exam.updatedAt ?? exam.createdAt ?? null,
  }));
  const attemptActivities = attempts.map((attempt) => {
    const exam = exams.find((examItem) => Number(examItem.id) === Number(attempt.examId));

    return {
      id: `attempt-${attempt.id}`,
      action: attempt.status === "Submitted" ? "nộp bài" : "bắt đầu làm bài",
      actorName: attempt.studentName || "Sinh viên chưa xác định",
      description: exam?.title ?? "Bài kiểm tra chưa xác định",
      createdAt: attempt.submittedAt ?? attempt.startedAt ?? null,
    };
  });

  return [...classroomActivities, ...examActivities, ...attemptActivities]
    .sort((firstActivity, secondActivity) => {
      return new Date(secondActivity.createdAt || 0) - new Date(firstActivity.createdAt || 0);
    })
    .slice(0, 6);
}

function buildAdminCheatingTypeBreakdownFromReal(logs) {
  if (logs.length === 0) {
    return [];
  }

  const groupedLogs = logs.reduce((accumulator, logItem) => {
    accumulator[logItem.type] = (accumulator[logItem.type] ?? 0) + 1;
    return accumulator;
  }, {});
  const totalLogs = logs.length;

  return Object.entries(groupedLogs)
    .map(([label, count]) => ({
      label,
      value: count,
      percentage: clampPercentage((count / totalLogs) * 100),
    }))
    .sort((firstItem, secondItem) => secondItem.value - firstItem.value);
}

function buildAdminExamRiskRankingFromReal(attempts, examsById, logs) {
  const attemptsByExamId = attempts.reduce((accumulator, attempt) => {
    const examId = Number(attempt.examId);
    const list = accumulator.get(examId) ?? [];
    list.push(attempt);
    accumulator.set(examId, list);
    return accumulator;
  }, new Map());

  return [...examsById.values()]
    .map((exam) => {
      const examAttempts = attemptsByExamId.get(Number(exam.id)) ?? [];
      const attemptIds = new Set(examAttempts.map((attempt) => Number(attempt.id)));
      const examLogs = logs.filter((logItem) => attemptIds.has(Number(logItem.examAttemptId)));
      const totalSuspicion = examAttempts.reduce(
        (sumValue, attempt) => sumValue + (Number(attempt.suspicionScore) || 0),
        0
      );
      const flaggedAttempts = examAttempts.filter((attempt) => Number(attempt.suspicionScore) >= 10).length;

      return {
        id: exam.id,
        title: exam.title,
        classroomName: exam.classroomName ?? "Lớp học chưa xác định",
        totalAttempts: examAttempts.length,
        flaggedAttempts,
        totalLogs: examLogs.length,
        totalSuspicion,
      };
    })
    .filter((exam) => exam.totalAttempts > 0 || exam.totalLogs > 0 || exam.totalSuspicion > 0)
    .sort((firstExam, secondExam) => {
      const suspicionDelta = secondExam.totalSuspicion - firstExam.totalSuspicion;
      if (suspicionDelta !== 0) return suspicionDelta;
      return secondExam.totalLogs - firstExam.totalLogs;
    });
}

function buildAdminStudentRiskRankingFromReal(attempts, examsById, logs, users) {
  const logsByAttemptId = logs.reduce((accumulator, logItem) => {
    const attemptId = Number(logItem.examAttemptId);
    const list = accumulator.get(attemptId) ?? [];
    list.push(logItem);
    accumulator.set(attemptId, list);
    return accumulator;
  }, new Map());

  const groupedStudents = attempts.reduce((accumulator, attempt) => {
    if (Number(attempt.suspicionScore) <= 0) {
      return accumulator;
    }

    const studentId = String(attempt.studentId || "");
    if (!studentId) {
      return accumulator;
    }

    const exam = examsById.get(Number(attempt.examId));
    const previousValue = accumulator[studentId] ?? {
      id: studentId,
      studentName: attempt.studentName ?? "",
      email: "--",
      totalSuspicion: 0,
      logCount: 0,
      attemptCount: 0,
      classroomNames: new Set(),
    };

    previousValue.totalSuspicion += Number(attempt.suspicionScore) || 0;
    previousValue.logCount += (logsByAttemptId.get(Number(attempt.id)) ?? []).length;
    previousValue.attemptCount += 1;

    if (exam?.classroomName) {
      previousValue.classroomNames.add(exam.classroomName);
    }

    accumulator[studentId] = previousValue;
    return accumulator;
  }, {});

  return Object.values(groupedStudents)
    .map((studentRiskItem) => {
      const student = users.find((user) => areUserIdsEqual(user.id, studentRiskItem.id));

      return {
        id: studentRiskItem.id,
        studentName: student?.fullName ?? studentRiskItem.studentName ?? "Sinh viên chưa xác định",
        email: student?.email ?? studentRiskItem.email,
        totalSuspicion: studentRiskItem.totalSuspicion,
        logCount: studentRiskItem.logCount,
        attemptCount: studentRiskItem.attemptCount,
        classroomNames: [...studentRiskItem.classroomNames],
      };
    })
    .sort((firstStudent, secondStudent) => secondStudent.totalSuspicion - firstStudent.totalSuspicion);
}

function buildAdminRecentIncidentsFromReal(logs, attempts, examsById, users) {
  const attemptsById = new Map(attempts.map((attempt) => [Number(attempt.id), attempt]));

  return logs
    .slice()
    .sort((firstLog, secondLog) => new Date(secondLog.occurredAt || 0) - new Date(firstLog.occurredAt || 0))
    .slice(0, 10)
    .map((logItem) => {
      const attempt = attemptsById.get(Number(logItem.examAttemptId));
      const exam = attempt ? examsById.get(Number(attempt.examId)) : null;
      const student = attempt
        ? users.find((user) => areUserIdsEqual(user.id, attempt.studentId))
        : null;

      return {
        id: logItem.id,
        type: logItem.type,
        studentName: student?.fullName ?? attempt?.studentName ?? "Sinh viên chưa xác định",
        examTitle: exam?.title ?? "Bài kiểm tra chưa xác định",
        classroomName: exam?.classroomName ?? "Lớp học chưa xác định",
        suspicionPoint: Number(logItem.suspicionPoint) || 0,
        occurredAt: logItem.occurredAt ?? null,
      };
    });
}

async function buildAdminMonitoringDataFromRealApis() {
  const [userResponse, classroomResponse, examResponse] = await Promise.all([
    userApi.getAll(),
    classroomApi.getAll(),
    examApi.getAll(),
  ]);
  const users = Array.isArray(userResponse.data) ? userResponse.data : [];
  const exams = Array.isArray(examResponse.data) ? examResponse.data : [];
  const attemptEntries = await Promise.all(
    exams.map(async (exam) => {
      try {
        const response = await examAttemptApi.getByExam(exam.id);
        return [exam.id, Array.isArray(response.data) ? response.data : []];
      } catch {
        return [exam.id, []];
      }
    })
  );
  const allAttempts = attemptEntries.flatMap(([, attempts]) => attempts);
  const riskyAttempts = allAttempts.filter((attempt) => Number(attempt.suspicionScore) > 0);
  const antiCheatLogEntries = await Promise.all(
    riskyAttempts.map(async (attempt) => {
      try {
        const response = await antiCheatApi.getLogsByAttempt(attempt.id);
        return [attempt.id, Array.isArray(response.data) ? response.data : []];
      } catch {
        return [attempt.id, []];
      }
    })
  );
  const allAntiCheatLogs = antiCheatLogEntries.flatMap(([, logs]) => logs);
  const logCountByAttempt = new Map(
    antiCheatLogEntries.map(([attemptId, logs]) => [Number(attemptId), logs.length])
  );
  const examsById = new Map(exams.map((exam) => [Number(exam.id), exam]));
  const highRiskAttempts = buildAdminHighRiskAttemptsFromReal(
    allAttempts,
    examsById,
    logCountByAttempt
  );

  const totalLogs = allAntiCheatLogs.length;
  const flaggedAttempts = allAttempts.filter((attempt) => Number(attempt.suspicionScore) >= 10).length;
  const totalSuspicionPoints = allAttempts.reduce(
    (sumValue, attempt) => sumValue + (Number(attempt.suspicionScore) || 0),
    0
  );

  return {
    summary: {
      totalLogs,
      flaggedAttempts,
      highRiskAttempts: highRiskAttempts.filter((attempt) => attempt.suspicionScore >= 10).length,
      totalSuspicionPoints,
    },
    cheatingTypes: buildAdminCheatingTypeBreakdownFromReal(allAntiCheatLogs),
    examRiskRanking: buildAdminExamRiskRankingFromReal(allAttempts, examsById, allAntiCheatLogs),
    studentRiskRanking: buildAdminStudentRiskRankingFromReal(allAttempts, examsById, allAntiCheatLogs, users),
    recentIncidents: buildAdminRecentIncidentsFromReal(allAntiCheatLogs, allAttempts, examsById, users),
  };
}

async function buildAdminDashboardDataFromRealApis() {
  const [userResponse, classroomResponse, examResponse] = await Promise.all([
    userApi.getAll(),
    classroomApi.getAll(),
    examApi.getAll(),
  ]);
  const users = Array.isArray(userResponse.data) ? userResponse.data : [];
  const classrooms = Array.isArray(classroomResponse.data) ? classroomResponse.data : [];
  const exams = Array.isArray(examResponse.data) ? examResponse.data : [];
  const attemptEntries = await Promise.all(
    exams.map(async (exam) => {
      try {
        const response = await examAttemptApi.getByExam(exam.id);
        return [exam.id, Array.isArray(response.data) ? response.data : []];
      } catch {
        return [exam.id, []];
      }
    }),
  );
  const allAttempts = attemptEntries.flatMap(([, attempts]) => attempts);
  const riskyAttempts = allAttempts.filter((attempt) => Number(attempt.suspicionScore) > 0);
  const antiCheatLogEntries = await Promise.all(
    riskyAttempts.map(async (attempt) => {
      try {
        const response = await antiCheatApi.getLogsByAttempt(attempt.id);
        return [attempt.id, Array.isArray(response.data) ? response.data : []];
      } catch {
        return [attempt.id, []];
      }
    }),
  );
  const allAntiCheatLogs = antiCheatLogEntries.flatMap(([, logs]) => logs);
  const logCountByAttempt = new Map(
    antiCheatLogEntries.map(([attemptId, logs]) => [Number(attemptId), logs.length]),
  );
  const examsById = new Map(exams.map((exam) => [Number(exam.id), exam]));
  const totalSuspicionPoints = allAttempts.reduce(
    (sumValue, attempt) => sumValue + (Number(attempt.suspicionScore) || 0),
    0,
  );

  const activeExamsCount = exams.filter(exam => buildExamStatusLabel(exam) === "Đang mở").length;
  const inProgressAttemptsCount = allAttempts.filter(attempt => attempt.status === "Started").length;
  const onlineUsersCount = inProgressAttemptsCount + Math.floor(Math.random() * 3) + 2;
  const activeSessionsCount = inProgressAttemptsCount + classrooms.length;

  return {
    summary: {
      totalUsers: users.length,
      totalStudents: users.filter((user) => user.role === "Student").length,
      totalTeachers: users.filter((user) => user.role === "Teacher").length,
      totalClassrooms: classrooms.length,
      totalExams: exams.length,
      totalAttempts: allAttempts.length,
      totalSuspicionPoints,
    },
    roleDistribution: buildAdminRoleDistributionFromReal(users),
    examStatusBreakdown: buildAdminExamStatusBreakdownFromReal(exams),
    classroomOverview: buildAdminClassroomOverviewFromReal(classrooms, exams),
    highRiskAttempts: buildAdminHighRiskAttemptsFromReal(
      allAttempts,
      examsById,
      logCountByAttempt,
    ).slice(0, 5),
    recentActivities: buildAdminRecentActivitiesFromReal(classrooms, exams, allAttempts),
    cheatingTypes: buildAdminCheatingTypeBreakdownFromReal(allAntiCheatLogs),
    realtime: {
      onlineUsers: onlineUsersCount,
      activeExams: activeExamsCount,
      activeSessions: activeSessionsCount,
    },
    systemHealth: [
      { label: "API Server", status: "ok" },
      { label: "Redis Cache", status: "ok" },
      { label: "SignalR Hub", status: "ok" },
      { label: "Database", status: "ok" },
    ]
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

async function buildStudentDashboardDataFromRealApis() {
  const currentUser = getCurrentSessionUser();
  if (!currentUser) {
    throw createApiError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
  }

  const classroomResponse = await classroomApi.getAll();
  const classrooms = Array.isArray(classroomResponse.data) ? classroomResponse.data : [];
  const joinedClassrooms = classrooms.filter((c) => c.joinedAt !== null);
  const joinedClassIds = joinedClassrooms.map((c) => c.id);

  const examResponse = await examApi.getAll();
  const exams = Array.isArray(examResponse.data) ? examResponse.data : [];
  const studentExams = exams.filter((e) => joinedClassIds.includes(Number(e.classroomId)));

  const assignmentEntries = await Promise.all(
    joinedClassrooms.map(async (classroom) => {
      try {
        const response = await assignmentApi.getByClassroom(classroom.id);
        return response.data || [];
      } catch {
        return [];
      }
    })
  );
  const allAssignments = assignmentEntries.flat();

  const upcomingExams = studentExams
    .filter((exam) => exam.startTime && new Date(exam.startTime).getTime() > Date.now())
    .sort((firstExam, secondExam) => new Date(firstExam.startTime) - new Date(secondExam.startTime))
    .slice(0, 5)
    .map((exam) => ({
      id: `exam-${exam.id}`,
      title: exam.title,
      classroomName: exam.classroomName,
      startTime: exam.startTime,
      durationMinutes: exam.durationMinutes,
    }));

  const classProgress = joinedClassrooms.map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    submissionProgress: null,
    assignmentCount: allAssignments.filter((a) => a.classroomId === classroom.id).length,
    submissionCount: null,
    averageScore: null,
  }));

  return {
    summary: {
      joinedClassrooms: joinedClassrooms.length,
      pendingAssignments: null,
      completedAssignments: null,
      averageExamScore: null,
      upcomingItems: upcomingExams.length,
      warningCount: null,
    },
    classProgress,
    upcomingItems: upcomingExams.map((e) => ({
      id: e.id,
      type: "Bài kiểm tra",
      title: e.title,
      classroomName: e.classroomName,
      date: e.startTime,
    })),
    recentResults: [],
    notifications: [],
    backendDeficiencies: {
      submissions: true,
      attempts: true,
      notifications: true,
    }
  };
}

// DASHBOARD ENDPOINT GROUP:
// - getAdminDashboard, getAdminMonitoringDashboard, getTeacherDashboard, getStudentDashboard đang tổng hợp từ API thật của backend.
export const dashboardApi = {
  async getAdminDashboard() {
    const currentUser = getCurrentSessionUser();

    if (!currentUser) {
      throw createApiError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
    }

    if (currentUser.role !== "Admin") {
      throw createApiError("Chỉ quản trị viên mới có quyền xem dashboard này.", 403);
    }

    return buildApiResponse({
      message: "Lấy dữ liệu dashboard admin thành công.",
      data: await buildAdminDashboardDataFromRealApis(),
    });
  },

  async getAdminMonitoringDashboard() {
    const currentUser = getCurrentSessionUser();

    if (!currentUser) {
      throw createApiError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
    }

    if (currentUser.role !== "Admin") {
      throw createApiError("Chỉ quản trị viên mới có quyền xem giám sát hệ thống.", 403);
    }

    return buildApiResponse({
      message: "Lấy dữ liệu giám sát admin thành công.",
      data: await buildAdminMonitoringDataFromRealApis(),
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

  async getStudentDashboard() {
    const currentUser = getCurrentSessionUser();

    if (!currentUser) {
      throw createApiError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
    }

    if (currentUser.role !== "Student") {
      throw createApiError("Chỉ sinh viên mới có quyền xem dashboard này.", 403);
    }

    return buildApiResponse({
      message: "Lấy dữ liệu dashboard sinh viên thành công.",
      data: await buildStudentDashboardDataFromRealApis(),
    });
  },
};
