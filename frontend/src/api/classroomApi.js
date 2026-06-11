import {
  appendActivityLog,
  buildApiResponse,
  createApiError,
  executeMockRequest,
  generateUniqueJoinCode,
  getAccessibleClassroomById,
  getNextNumericId,
  getVisibleClassrooms,
  readMockDatabase,
  requireCurrentUser,
  toClassroomDto,
  writeMockDatabase,
} from "./mockDatabase";

// MOCK STATUS:
// - Toàn bộ classroom API trong file này vẫn đang giả lập bằng mockDatabase/localStorage.
// - UI quản lý lớp đã chạy đủ create/update/delete/join, nhưng chưa gọi backend classroom thật.

// Hàm này kiểm tra payload tạo hoặc cập nhật classroom để tránh đẩy dữ liệu rỗng xuống storage.
function validateClassroomPayload(payload) {
  if (!payload.name?.trim()) {
    throw createApiError("Tên lớp học không được để trống.");
  }

  if (!payload.joinCode?.trim()) {
    throw createApiError("Mã lớp không được để trống.");
  }
}

// Hàm này chuẩn hóa mã lớp để giáo viên gõ tay hay bấm random đều về cùng một format.
function normalizeJoinCode(joinCode) {
  return joinCode.trim().toUpperCase().replace(/\s+/g, "");
}

// Hàm này kiểm tra xem mã lớp có bị trùng với lớp khác hay không.
function ensureUniqueJoinCode(database, joinCode, excludedClassroomId = null) {
  const normalizedJoinCode = normalizeJoinCode(joinCode);
  const hasDuplicate = database.classrooms.some(
    (classroom) =>
      classroom.joinCode === normalizedJoinCode && classroom.id !== Number(excludedClassroomId),
  );

  if (hasDuplicate) {
    throw createApiError("Mã lớp này đã tồn tại. Bạn hãy đổi mã khác nhé.");
  }

  return normalizedJoinCode;
}

// Hàm này bắt buộc role Teacher trước khi cho tạo, sửa hoặc xóa classroom.
function requireTeacherUser(currentUser) {
  if (currentUser.role !== "Teacher") {
    throw createApiError("Chỉ giảng viên mới có quyền thao tác lớp học.", 403);
  }
}

// Hàm này lấy classroom thuộc quyền sở hữu của teacher để phục vụ update và delete an toàn.
function requireTeacherOwnedClassroom(database, currentUser, classroomId) {
  const classroom = getAccessibleClassroomById(database, currentUser, classroomId);

  if (classroom.teacherId !== currentUser.id || currentUser.role !== "Teacher") {
    throw createApiError("Bạn chỉ có thể quản lý lớp học do mình tạo.", 403);
  }

  return classroom;
}

// Hàm này trả classroom detail response sau khi teacher vừa create, update hoặc student vừa join.
function buildClassroomDetailResponse(database, currentUser, classroom, message) {
  return buildApiResponse({
    message,
    data: toClassroomDto(classroom, database, currentUser),
  });
}

// MOCK ENDPOINT GROUP:
// - getAll / getById / getMembers / generateJoinCode / create / update / delete / join đều đang là mock endpoint.
export const classroomApi = {
  getAll() {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);

      return buildApiResponse({
        message: "Lấy danh sách lớp học thành công.",
        data: getVisibleClassrooms(database, currentUser),
      });
    });
  },

  getById(classroomId) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const classroom = getAccessibleClassroomById(database, currentUser, classroomId);

      return buildClassroomDetailResponse(
        database,
        currentUser,
        classroom,
        "Lấy thông tin lớp học thành công.",
      );
    });
  },

  getMembers(classroomId) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const classroom = getAccessibleClassroomById(database, currentUser, classroomId);
      const classroomDto = toClassroomDto(classroom, database, currentUser);

      return buildApiResponse({
        message: "Lấy danh sách thành viên thành công.",
        data: classroomDto.members,
      });
    });
  },

  generateJoinCode() {
    return executeMockRequest(() => {
      const database = readMockDatabase();

      return buildApiResponse({
        message: "Tạo mã lớp thành công.",
        data: {
          joinCode: generateUniqueJoinCode(database.classrooms),
        },
      });
    });
  },

  create(payload) {
    return executeMockRequest(() => {
      validateClassroomPayload(payload);

      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      requireTeacherUser(currentUser);

      const normalizedJoinCode = ensureUniqueJoinCode(database, payload.joinCode);
      const newClassroom = {
        id: getNextNumericId(database.classrooms),
        name: payload.name.trim(),
        description: payload.description?.trim() || "",
        joinCode: normalizedJoinCode,
        teacherId: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };

      database.classrooms.push(newClassroom);
      appendActivityLog(database, {
        userId: currentUser.id,
        action: "CLASSROOM_CREATE",
        description: `Giảng viên ${currentUser.email} tạo lớp ${newClassroom.name}.`,
      });
      writeMockDatabase(database);

      return buildClassroomDetailResponse(
        database,
        currentUser,
        newClassroom,
        "Tạo lớp học thành công.",
      );
    });
  },

  update(classroomId, payload) {
    return executeMockRequest(() => {
      validateClassroomPayload(payload);

      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const classroom = requireTeacherOwnedClassroom(database, currentUser, classroomId);
      const normalizedJoinCode = ensureUniqueJoinCode(database, payload.joinCode, classroom.id);

      classroom.name = payload.name.trim();
      classroom.description = payload.description?.trim() || "";
      classroom.joinCode = normalizedJoinCode;
      classroom.updatedAt = new Date().toISOString();

      appendActivityLog(database, {
        userId: currentUser.id,
        action: "CLASSROOM_UPDATE",
        description: `Giảng viên ${currentUser.email} cập nhật lớp ${classroom.name}.`,
      });
      writeMockDatabase(database);

      return buildClassroomDetailResponse(
        database,
        currentUser,
        classroom,
        "Cập nhật lớp học thành công.",
      );
    });
  },

  delete(classroomId) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const classroom = requireTeacherOwnedClassroom(database, currentUser, classroomId);
      const assignmentIds = database.assignments
        .filter((assignment) => assignment.classroomId === classroom.id)
        .map((assignment) => assignment.id);
      const examIds = database.exams
        .filter((exam) => exam.classroomId === classroom.id)
        .map((exam) => exam.id);
      const questionIds = database.questions
        .filter((question) => examIds.includes(question.examId))
        .map((question) => question.id);
      const attemptIds = database.examAttempts
        .filter((attempt) => examIds.includes(attempt.examId))
        .map((attempt) => attempt.id);

      database.classrooms = database.classrooms.filter((item) => item.id !== classroom.id);
      database.classroomMembers = database.classroomMembers.filter(
        (member) => member.classroomId !== classroom.id,
      );
      database.assignments = database.assignments.filter(
        (assignment) => assignment.classroomId !== classroom.id,
      );
      database.submissions = database.submissions.filter(
        (submission) => !assignmentIds.includes(submission.assignmentId),
      );
      database.exams = database.exams.filter((exam) => exam.classroomId !== classroom.id);
      database.examSettings = database.examSettings.filter(
        (setting) => !examIds.includes(setting.examId),
      );
      database.questions = database.questions.filter((question) => !examIds.includes(question.examId));
      database.answers = database.answers.filter((answer) => !questionIds.includes(answer.questionId));
      database.examAttempts = database.examAttempts.filter((attempt) => !examIds.includes(attempt.examId));
      database.cheatingLogs = database.cheatingLogs.filter(
        (logItem) => !attemptIds.includes(logItem.examAttemptId),
      );
      appendActivityLog(database, {
        userId: currentUser.id,
        action: "CLASSROOM_DELETE",
        description: `Giảng viên ${currentUser.email} xóa lớp ${classroom.name}.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Xóa lớp học thành công.",
        data: null,
      });
    });
  },

  join(joinCode) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);

      if (currentUser.role !== "Student") {
        throw createApiError("Chỉ học sinh mới có thể tham gia lớp bằng mã.", 403);
      }

      const normalizedJoinCode = normalizeJoinCode(joinCode);
      const classroom = database.classrooms.find(
        (classroomItem) => classroomItem.joinCode === normalizedJoinCode,
      );

      if (!classroom) {
        throw createApiError("Không tìm thấy lớp học với mã này.", 404);
      }

      const existingMembership = database.classroomMembers.find(
        (member) =>
          member.classroomId === classroom.id &&
          member.studentId === currentUser.id &&
          member.status === "Active",
      );

      if (existingMembership) {
        throw createApiError("Bạn đã tham gia lớp học này rồi.", 409);
      }

      database.classroomMembers.push({
        id: getNextNumericId(database.classroomMembers),
        classroomId: classroom.id,
        studentId: currentUser.id,
        joinedAt: new Date().toISOString(),
        status: "Active",
      });
      appendActivityLog(database, {
        userId: currentUser.id,
        action: "CLASSROOM_JOIN",
        description: `Học sinh ${currentUser.email} tham gia lớp ${classroom.name}.`,
      });
      writeMockDatabase(database);

      return buildClassroomDetailResponse(
        database,
        currentUser,
        classroom,
        "Tham gia lớp học thành công.",
      );
    });
  },
};
