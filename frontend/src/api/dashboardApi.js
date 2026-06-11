import {
  buildApiResponse,
  createApiError,
  executeMockRequest,
  readMockDatabase,
  requireCurrentUser,
} from "./mockDatabase";

// MOCK STATUS:
// - Dashboard hiện mới có frontend/mock API để hoàn thiện UI, chưa gọi backend dashboard thật.
// - Toàn bộ thống kê trong file này đang được tổng hợp từ mockDatabase/localStorage.

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
      const actor = database.users.find((user) => user.id === logItem.userId);

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
      const student = database.users.find((user) => user.id === studentRiskItem.studentId);

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

// Hàm này dựng dashboard cho teacher bằng cách lọc các bảng thuộc quyền của giảng viên hiện tại.
function buildTeacherDashboardData(database, currentUser) {
  const managedClassrooms = database.classrooms.filter(
    (classroom) => classroom.teacherId === currentUser.id,
  );
  const classroomIds = managedClassrooms.map((classroom) => classroom.id);
  const teacherAssignments = database.assignments.filter(
    (assignment) => assignment.teacherId === currentUser.id,
  );
  const teacherExams = database.exams.filter((exam) => exam.teacherId === currentUser.id);
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

  return {
    summary: {
      managedClassrooms: managedClassrooms.length,
      totalStudents: studentIds.length,
      totalAssignments: teacherAssignments.length,
      totalExams: teacherExams.length,
      submissionRate: calculateTeacherSubmissionRate(database, teacherAssignments),
      averageExamScore: calculateAverage(attemptScores),
    },
    classroomPerformance: buildTeacherClassroomPerformance(database, managedClassrooms),
    highRiskStudents: buildHighRiskStudents(database, teacherExamIds),
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
        submission.studentId === currentUser.id &&
        classroomAssignments.some((assignment) => assignment.id === submission.assignmentId),
    ).length;
    const classroomExams = database.exams.filter((exam) => exam.classroomId === classroom.id);
    const attemptScores = database.examAttempts
      .filter(
        (attempt) =>
          attempt.studentId === currentUser.id &&
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
    .filter((attempt) => attempt.studentId === currentUser.id && typeof attempt.score === "number")
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
    (member) => member.studentId === currentUser.id && member.status === "Active",
  );
  const joinedClassIds = joinedMemberships.map((member) => member.classroomId);
  const joinedClassrooms = database.classrooms.filter((classroom) => joinedClassIds.includes(classroom.id));
  const studentAssignments = database.assignments.filter((assignment) =>
    joinedClassIds.includes(assignment.classroomId),
  );
  const studentSubmissions = database.submissions.filter(
    (submission) => submission.studentId === currentUser.id,
  );
  const studentExamAttempts = database.examAttempts.filter((attempt) => attempt.studentId === currentUser.id);
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
      .filter((notification) => notification.userId === currentUser.id)
      .sort((firstNotification, secondNotification) => {
        return new Date(secondNotification.createdAt) - new Date(firstNotification.createdAt);
      })
      .slice(0, 5),
  };
}

// MOCK ENDPOINT GROUP:
// - getAdminDashboard / getTeacherDashboard / getStudentDashboard đều là mock endpoint theo role.
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

  getTeacherDashboard() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);

      if (currentUser.role !== "Teacher") {
        throw createApiError("Chỉ giảng viên mới có quyền xem dashboard này.", 403);
      }

      return buildApiResponse({
        message: "Lấy dữ liệu dashboard giảng viên thành công.",
        data: buildTeacherDashboardData(database, currentUser),
      });
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
