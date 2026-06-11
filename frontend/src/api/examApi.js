import {
  appendActivityLog,
  buildApiResponse,
  canUserViewClassroom,
  createApiError,
  executeMockRequest,
  getAccessibleClassroomById,
  getNextNumericId,
  readMockDatabase,
  requireCurrentUser,
  writeMockDatabase,
} from "./mockDatabase";

const EXAM_QUESTION_TYPES = ["SingleChoice", "MultipleChoice", "TrueFalse", "ShortAnswer"];

// Hàm này kiểm tra dữ liệu đề thi trước khi create hoặc update để tránh lưu record lỗi.
function validateExamPayload(payload) {
  if (!payload.classroomId) {
    throw createApiError("Bạn cần chọn lớp học cho bài kiểm tra.");
  }

  if (!payload.title?.trim()) {
    throw createApiError("Tiêu đề bài kiểm tra không được để trống.");
  }

  if (!Number(payload.durationMinutes) || Number(payload.durationMinutes) <= 0) {
    throw createApiError("Thời gian làm bài phải lớn hơn 0 phút.");
  }

  if (payload.startTime && payload.endTime) {
    const startTime = new Date(payload.startTime).getTime();
    const endTime = new Date(payload.endTime).getTime();

    if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
      throw createApiError("Thời gian đóng đề phải sau thời gian mở đề.");
    }
  }

  if (!Number(payload.settings?.maxAttempts) || Number(payload.settings.maxAttempts) <= 0) {
    throw createApiError("Số lần làm tối đa phải lớn hơn 0.");
  }
}

// Hàm này cố định cấu trúc đáp án đúng/sai để teacher không nhập lệch nội dung chuẩn của loại câu hỏi này.
function buildTrueFalseAnswerPayload(answers = []) {
  const trueAnswer = answers[0] ?? {};
  const falseAnswer = answers[1] ?? {};
  const correctIndex = answers.findIndex((answer) => Boolean(answer.isCorrect));

  return [
    {
      id: trueAnswer.id ?? null,
      content: "Đúng",
      isCorrect: correctIndex === -1 ? true : correctIndex === 0,
      orderIndex: 1,
    },
    {
      id: falseAnswer.id ?? null,
      content: "Sai",
      isCorrect: correctIndex === 1,
      orderIndex: 2,
    },
  ];
}

// Hàm này chuẩn hóa mảng đáp án gửi từ form để API phía dưới xử lý đồng nhất hơn.
function normalizeQuestionAnswers(questionType, answers = []) {
  if (questionType === "TrueFalse") {
    return buildTrueFalseAnswerPayload(answers);
  }

  if (questionType === "ShortAnswer") {
    return answers
      .map((answer, index) => ({
        id: answer.id ?? null,
        content: answer.content?.trim() ?? "",
        isCorrect: true,
        orderIndex: index + 1,
      }))
      .filter((answer) => answer.content);
  }

  return answers
    .map((answer, index) => ({
      id: answer.id ?? null,
      content: answer.content?.trim() ?? "",
      isCorrect: Boolean(answer.isCorrect),
      orderIndex: index + 1,
    }))
    .filter((answer) => answer.content);
}

// Hàm này vừa validate vừa trả payload câu hỏi đã được parse sạch để create/update dùng chung.
function parseQuestionPayload(payload) {
  if (!payload.content?.trim()) {
    throw createApiError("Nội dung câu hỏi không được để trống.");
  }

  if (!EXAM_QUESTION_TYPES.includes(payload.questionType)) {
    throw createApiError("Loại câu hỏi không hợp lệ.");
  }

  if (!Number(payload.score) || Number(payload.score) <= 0) {
    throw createApiError("Điểm của câu hỏi phải lớn hơn 0.");
  }

  if (!Number(payload.orderIndex) || Number(payload.orderIndex) <= 0) {
    throw createApiError("Thứ tự câu hỏi phải lớn hơn 0.");
  }

  const normalizedAnswers = normalizeQuestionAnswers(payload.questionType, payload.answers);
  const correctAnswerCount = normalizedAnswers.filter((answer) => answer.isCorrect).length;

  if (payload.questionType === "ShortAnswer" && normalizedAnswers.length === 0) {
    throw createApiError("Câu tự luận ngắn cần ít nhất 1 đáp án mẫu chấp nhận.");
  }

  if (payload.questionType === "SingleChoice" && normalizedAnswers.length < 2) {
    throw createApiError("Câu một đáp án cần ít nhất 2 lựa chọn.");
  }

  if (payload.questionType === "SingleChoice" && correctAnswerCount !== 1) {
    throw createApiError("Câu một đáp án phải có đúng 1 đáp án đúng.");
  }

  if (payload.questionType === "MultipleChoice" && normalizedAnswers.length < 2) {
    throw createApiError("Câu nhiều đáp án cần ít nhất 2 lựa chọn.");
  }

  if (payload.questionType === "MultipleChoice" && correctAnswerCount === 0) {
    throw createApiError("Câu nhiều đáp án cần ít nhất 1 đáp án đúng.");
  }

  if (payload.questionType === "TrueFalse" && correctAnswerCount !== 1) {
    throw createApiError("Câu đúng/sai phải có đúng 1 đáp án đúng.");
  }

  return {
    content: payload.content.trim(),
    questionType: payload.questionType,
    score: Number(payload.score),
    orderIndex: Math.max(1, Math.floor(Number(payload.orderIndex))),
    answers: normalizedAnswers,
  };
}

// Hàm này lấy setting của một exam, nếu chưa có thì trả setting mặc định để code phía dưới đỡ rẽ nhánh.
function getExamSettingByExamId(database, examId) {
  const examSetting = database.examSettings.find((setting) => setting.examId === examId);

  if (examSetting) {
    return examSetting;
  }

  return {
    id: null,
    examId,
    shuffleQuestions: false,
    shuffleAnswers: false,
    maxAttempts: 1,
    showResultAfterSubmit: false,
    requireFullscreen: false,
  };
}

// Hàm này sắp câu hỏi theo thứ tự hiển thị trước rồi mới fallback sang id để list ổn định hơn.
function sortQuestionsByOrder(firstQuestion, secondQuestion) {
  if (firstQuestion.orderIndex !== secondQuestion.orderIndex) {
    return firstQuestion.orderIndex - secondQuestion.orderIndex;
  }

  return firstQuestion.id - secondQuestion.id;
}

// Hàm này sắp đáp án theo order index để UI luôn bám đúng thứ tự teacher đã nhập.
function sortAnswersByOrder(firstAnswer, secondAnswer) {
  if (firstAnswer.orderIndex !== secondAnswer.orderIndex) {
    return firstAnswer.orderIndex - secondAnswer.orderIndex;
  }

  return firstAnswer.id - secondAnswer.id;
}

// Hàm này tính điểm trung bình của đề thi để card hoặc detail page dùng lại được.
function calculateAverageScore(database, examId) {
  const scores = database.examAttempts
    .filter((attempt) => attempt.examId === examId && typeof attempt.score === "number")
    .map((attempt) => attempt.score);

  if (scores.length === 0) {
    return 0;
  }

  const totalValue = scores.reduce((sumValue, scoreValue) => sumValue + scoreValue, 0);
  return Math.round((totalValue / scores.length) * 10) / 10;
}

// Hàm này cộng tổng điểm của toàn bộ câu hỏi trong đề để detail page có thể hiển thị nhanh.
function calculateTotalQuestionScore(database, examId) {
  return database.questions
    .filter((question) => question.examId === examId)
    .reduce((sumValue, question) => sumValue + Number(question.score || 0), 0);
}

// Hàm này đổi exam sang trạng thái dễ hiểu để UI không phải tự viết logic thời gian ở nhiều nơi.
function getExamStatusLabel(exam) {
  if (!exam.isPublished) {
    return "Bản nháp";
  }

  const now = Date.now();
  const startTime = exam.startTime ? new Date(exam.startTime).getTime() : null;
  const endTime = exam.endTime ? new Date(exam.endTime).getTime() : null;

  if (startTime && now < startTime) {
    return "Sắp mở";
  }

  if (startTime && endTime && now >= startTime && now <= endTime) {
    return "Đang mở";
  }

  if (endTime && now > endTime) {
    return "Đã đóng";
  }

  return "Đang hiển thị";
}

// Hàm này kiểm tra current user có quyền xem một exam cụ thể hay không.
function canUserViewExam(database, currentUser, exam) {
  const classroom = database.classrooms.find((classroomItem) => classroomItem.id === exam.classroomId);

  if (!classroom) {
    return false;
  }

  if (currentUser.role === "Admin") {
    return true;
  }

  if (currentUser.role === "Teacher") {
    return exam.teacherId === currentUser.id;
  }

  return exam.isPublished && canUserViewClassroom(currentUser, classroom, database);
}

// Hàm này giới hạn quyền xem question bank để không lộ nội dung và đáp án cho sinh viên.
function canUserInspectQuestionBank(currentUser, exam) {
  if (currentUser.role === "Admin") {
    return true;
  }

  return currentUser.role === "Teacher" && exam.teacherId === currentUser.id;
}

// Hàm này lấy exam theo id rồi chặn luôn các trường hợp user xem sai quyền.
function getAccessibleExamById(database, currentUser, examId) {
  const numericExamId = Number(examId);
  const exam = database.exams.find((examItem) => examItem.id === numericExamId);

  if (!exam) {
    throw createApiError("Không tìm thấy bài kiểm tra.", 404);
  }

  if (!canUserViewExam(database, currentUser, exam)) {
    throw createApiError("Bạn không có quyền xem bài kiểm tra này.", 403);
  }

  return exam;
}

// Hàm này bắt buộc teacher chỉ được thao tác với exam do chính mình tạo.
function requireTeacherOwnedExam(database, currentUser, examId) {
  const exam = getAccessibleExamById(database, currentUser, examId);

  if (currentUser.role !== "Teacher" || exam.teacherId !== currentUser.id) {
    throw createApiError("Bạn chỉ có thể quản lý bài kiểm tra do mình tạo.", 403);
  }

  return exam;
}

// Hàm này chặn các role không được mở question bank ở màn chi tiết đề thi.
function requireQuestionBankAccess(database, currentUser, examId) {
  const exam = getAccessibleExamById(database, currentUser, examId);

  if (!canUserInspectQuestionBank(currentUser, exam)) {
    throw createApiError("Bạn chưa thể xem nội dung câu hỏi ở màn hình này.", 403);
  }

  return exam;
}

// Hàm này lấy question theo id và đồng thời đảm bảo teacher hiện tại thật sự sở hữu đề đó.
function requireTeacherOwnedQuestion(database, currentUser, questionId) {
  const numericQuestionId = Number(questionId);
  const question = database.questions.find((questionItem) => questionItem.id === numericQuestionId);

  if (!question) {
    throw createApiError("Không tìm thấy câu hỏi.", 404);
  }

  const exam = requireTeacherOwnedExam(database, currentUser, question.examId);
  return { exam, question };
}

// Hàm này đổi record answer sang DTO nhẹ để UI render được ngay.
function buildAnswerDto(answer) {
  return {
    id: answer.id,
    questionId: answer.questionId,
    content: answer.content,
    isCorrect: answer.isCorrect,
    orderIndex: answer.orderIndex,
  };
}

// Hàm này đổi question record sang DTO đầy đủ, có gộp luôn answers bên trong.
function buildQuestionDto(database, question) {
  const answers = database.answers
    .filter((answer) => answer.questionId === question.id)
    .sort(sortAnswersByOrder)
    .map((answer) => buildAnswerDto(answer));

  return {
    id: question.id,
    examId: question.examId,
    content: question.content,
    questionType: question.questionType,
    score: question.score,
    orderIndex: question.orderIndex,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt ?? null,
    answerCount: answers.length,
    correctAnswerCount: answers.filter((answer) => answer.isCorrect).length,
    answers,
  };
}

// Hàm này lấy question bank của một đề thi rồi sort đúng thứ tự để teacher/admin dễ theo dõi.
function getQuestionListByExamId(database, examId) {
  return database.questions
    .filter((question) => question.examId === examId)
    .sort(sortQuestionsByOrder)
    .map((question) => buildQuestionDto(database, question));
}

// Hàm này đổi record exam sang DTO hoàn chỉnh để page chỉ việc render.
function toExamDto(database, currentUser, exam) {
  const classroom = database.classrooms.find((classroomItem) => classroomItem.id === exam.classroomId);
  const teacher = database.users.find((userItem) => userItem.id === exam.teacherId);
  const setting = getExamSettingByExamId(database, exam.id);
  const questionCount = database.questions.filter((question) => question.examId === exam.id).length;
  const attemptCount = database.examAttempts.filter((attempt) => attempt.examId === exam.id).length;

  return {
    id: exam.id,
    classroomId: exam.classroomId,
    classroomName: classroom?.name ?? "Lớp học chưa xác định",
    teacherId: exam.teacherId,
    teacherName: teacher?.fullName ?? "Giảng viên chưa xác định",
    title: exam.title,
    description: exam.description,
    durationMinutes: exam.durationMinutes,
    startTime: exam.startTime,
    endTime: exam.endTime,
    isPublished: exam.isPublished,
    enableAntiCheat: exam.enableAntiCheat,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt ?? null,
    statusLabel: getExamStatusLabel(exam),
    questionCount,
    totalQuestionScore: calculateTotalQuestionScore(database, exam.id),
    attemptCount,
    averageScore: calculateAverageScore(database, exam.id),
    settings: {
      shuffleQuestions: setting.shuffleQuestions,
      shuffleAnswers: setting.shuffleAnswers,
      maxAttempts: setting.maxAttempts,
      showResultAfterSubmit: setting.showResultAfterSubmit,
      requireFullscreen: setting.requireFullscreen,
    },
    canEdit: currentUser?.role === "Teacher" && currentUser.id === exam.teacherId,
    canDelete: currentUser?.role === "Teacher" && currentUser.id === exam.teacherId,
    canViewQuestionBank: canUserInspectQuestionBank(currentUser, exam),
  };
}

// Hàm này cập nhật hoặc tạo exam setting đi kèm record exam hiện tại.
function upsertExamSetting(database, examId, settingsPayload) {
  const matchedSetting = database.examSettings.find((setting) => setting.examId === examId);

  if (matchedSetting) {
    matchedSetting.shuffleQuestions = Boolean(settingsPayload.shuffleQuestions);
    matchedSetting.shuffleAnswers = Boolean(settingsPayload.shuffleAnswers);
    matchedSetting.maxAttempts = Number(settingsPayload.maxAttempts);
    matchedSetting.showResultAfterSubmit = Boolean(settingsPayload.showResultAfterSubmit);
    matchedSetting.requireFullscreen = Boolean(settingsPayload.requireFullscreen);
    return matchedSetting;
  }

  const nextSetting = {
    id: getNextNumericId(database.examSettings),
    examId,
    shuffleQuestions: Boolean(settingsPayload.shuffleQuestions),
    shuffleAnswers: Boolean(settingsPayload.shuffleAnswers),
    maxAttempts: Number(settingsPayload.maxAttempts),
    showResultAfterSubmit: Boolean(settingsPayload.showResultAfterSubmit),
    requireFullscreen: Boolean(settingsPayload.requireFullscreen),
  };

  database.examSettings.push(nextSetting);
  return nextSetting;
}

// Hàm này ghi đè bảng Answer của một câu hỏi theo mảng payload mới để CRUD đáp án gói gọn trong 1 lần lưu.
function upsertQuestionAnswers(database, questionId, answerPayloads) {
  const existingAnswers = database.answers.filter((answer) => answer.questionId === questionId);
  const incomingAnswerIds = answerPayloads
    .map((answer) => Number(answer.id) || 0)
    .filter((answerId) => answerId > 0);

  database.answers = database.answers.filter((answer) => {
    return answer.questionId !== questionId || incomingAnswerIds.includes(answer.id);
  });

  answerPayloads.forEach((answerPayload, index) => {
    const matchedAnswer = existingAnswers.find((answer) => answer.id === Number(answerPayload.id));

    if (matchedAnswer) {
      matchedAnswer.content = answerPayload.content;
      matchedAnswer.isCorrect = Boolean(answerPayload.isCorrect);
      matchedAnswer.orderIndex = index + 1;
      return;
    }

    database.answers.push({
      id: getNextNumericId(database.answers),
      questionId,
      content: answerPayload.content,
      isCorrect: Boolean(answerPayload.isCorrect),
      orderIndex: index + 1,
    });
  });
}

// Hàm này chuẩn hóa lại thứ tự tất cả câu hỏi trong đề sau khi xóa hoặc chèn lại vị trí.
function renumberExamQuestions(database, examId) {
  const questionItems = database.questions
    .filter((question) => question.examId === examId)
    .sort(sortQuestionsByOrder);

  questionItems.forEach((question, index) => {
    question.orderIndex = index + 1;
  });
}

// Hàm này đưa một câu hỏi về đúng vị trí mới rồi dồn lại order index cho toàn bộ đề.
function resequenceExamQuestions(database, examId, movingQuestionId, targetOrderIndex) {
  const movingQuestion = database.questions.find((question) => question.id === movingQuestionId);

  if (!movingQuestion) {
    return;
  }

  const siblingQuestions = database.questions
    .filter((question) => question.examId === examId && question.id !== movingQuestionId)
    .sort(sortQuestionsByOrder);
  const clampedIndex = Math.min(
    Math.max(Number(targetOrderIndex) || siblingQuestions.length + 1, 1),
    siblingQuestions.length + 1,
  );

  siblingQuestions.splice(clampedIndex - 1, 0, movingQuestion);
  siblingQuestions.forEach((question, index) => {
    question.orderIndex = index + 1;
  });
}

// Hàm này kiểm tra classroom mục tiêu có thực sự thuộc teacher hiện tại trước khi gắn exam vào.
function requireTeacherOwnedClassroomForExam(database, currentUser, classroomId) {
  const classroom = getAccessibleClassroomById(database, currentUser, classroomId);

  if (currentUser.role !== "Teacher" || classroom.teacherId !== currentUser.id) {
    throw createApiError("Bạn chỉ có thể tạo đề trong lớp học do mình phụ trách.", 403);
  }

  return classroom;
}

// Object này mô phỏng exam endpoint để frontend làm CRUD đề thi như đang gọi backend thật.
export const examApi = {
  getAll(filters = {}) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const classroomFilter = filters.classroomId ? Number(filters.classroomId) : null;

      const examItems = database.exams
        .filter((exam) => canUserViewExam(database, currentUser, exam))
        .filter((exam) => (classroomFilter ? exam.classroomId === classroomFilter : true))
        .sort((firstExam, secondExam) => {
          return new Date(secondExam.createdAt) - new Date(firstExam.createdAt);
        })
        .map((exam) => toExamDto(database, currentUser, exam));

      return buildApiResponse({
        message: "Lấy danh sách bài kiểm tra thành công.",
        data: examItems,
      });
    });
  },

  getById(examId) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const exam = getAccessibleExamById(database, currentUser, examId);

      return buildApiResponse({
        message: "Lấy chi tiết bài kiểm tra thành công.",
        data: toExamDto(database, currentUser, exam),
      });
    });
  },

  getQuestionList(examId) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const exam = requireQuestionBankAccess(database, currentUser, examId);

      return buildApiResponse({
        message: "Lấy danh sách câu hỏi thành công.",
        data: getQuestionListByExamId(database, exam.id),
      });
    });
  },

  create(payload) {
    return executeMockRequest(() => {
      validateExamPayload(payload);

      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);

      if (currentUser.role !== "Teacher") {
        throw createApiError("Chỉ giảng viên mới có quyền tạo bài kiểm tra.", 403);
      }

      requireTeacherOwnedClassroomForExam(database, currentUser, payload.classroomId);

      const newExam = {
        id: getNextNumericId(database.exams),
        classroomId: Number(payload.classroomId),
        teacherId: currentUser.id,
        title: payload.title.trim(),
        description: payload.description?.trim() || "",
        durationMinutes: Number(payload.durationMinutes),
        startTime: payload.startTime || null,
        endTime: payload.endTime || null,
        isPublished: Boolean(payload.isPublished),
        enableAntiCheat: Boolean(payload.enableAntiCheat),
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };

      database.exams.push(newExam);
      upsertExamSetting(database, newExam.id, payload.settings);
      appendActivityLog(database, {
        userId: currentUser.id,
        action: "EXAM_CREATE",
        description: `Giảng viên ${currentUser.email} tạo bài kiểm tra ${newExam.title}.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Tạo bài kiểm tra thành công.",
        data: toExamDto(database, currentUser, newExam),
      });
    });
  },

  update(examId, payload) {
    return executeMockRequest(() => {
      validateExamPayload(payload);

      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const exam = requireTeacherOwnedExam(database, currentUser, examId);
      requireTeacherOwnedClassroomForExam(database, currentUser, payload.classroomId);

      exam.classroomId = Number(payload.classroomId);
      exam.title = payload.title.trim();
      exam.description = payload.description?.trim() || "";
      exam.durationMinutes = Number(payload.durationMinutes);
      exam.startTime = payload.startTime || null;
      exam.endTime = payload.endTime || null;
      exam.isPublished = Boolean(payload.isPublished);
      exam.enableAntiCheat = Boolean(payload.enableAntiCheat);
      exam.updatedAt = new Date().toISOString();
      upsertExamSetting(database, exam.id, payload.settings);

      appendActivityLog(database, {
        userId: currentUser.id,
        action: "EXAM_UPDATE",
        description: `Giảng viên ${currentUser.email} cập nhật bài kiểm tra ${exam.title}.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Cập nhật bài kiểm tra thành công.",
        data: toExamDto(database, currentUser, exam),
      });
    });
  },

  createQuestion(examId, payload) {
    return executeMockRequest(() => {
      const parsedPayload = parseQuestionPayload(payload);
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const exam = requireTeacherOwnedExam(database, currentUser, examId);
      const nextQuestion = {
        id: getNextNumericId(database.questions),
        examId: exam.id,
        content: parsedPayload.content,
        questionType: parsedPayload.questionType,
        score: parsedPayload.score,
        orderIndex: database.questions.filter((question) => question.examId === exam.id).length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };

      database.questions.push(nextQuestion);
      resequenceExamQuestions(database, exam.id, nextQuestion.id, parsedPayload.orderIndex);
      upsertQuestionAnswers(database, nextQuestion.id, parsedPayload.answers);

      appendActivityLog(database, {
        userId: currentUser.id,
        action: "QUESTION_CREATE",
        description: `Giảng viên ${currentUser.email} thêm câu hỏi vào đề ${exam.title}.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Thêm câu hỏi thành công.",
        data: buildQuestionDto(database, nextQuestion),
      });
    });
  },

  updateQuestion(examId, questionId, payload) {
    return executeMockRequest(() => {
      const parsedPayload = parseQuestionPayload(payload);
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const { exam, question } = requireTeacherOwnedQuestion(database, currentUser, questionId);

      if (Number(examId) !== question.examId) {
        throw createApiError("Câu hỏi này không thuộc đề thi hiện tại.", 400);
      }

      question.content = parsedPayload.content;
      question.questionType = parsedPayload.questionType;
      question.score = parsedPayload.score;
      question.updatedAt = new Date().toISOString();
      resequenceExamQuestions(database, exam.id, question.id, parsedPayload.orderIndex);
      upsertQuestionAnswers(database, question.id, parsedPayload.answers);

      appendActivityLog(database, {
        userId: currentUser.id,
        action: "QUESTION_UPDATE",
        description: `Giảng viên ${currentUser.email} cập nhật câu hỏi của đề ${exam.title}.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Cập nhật câu hỏi thành công.",
        data: buildQuestionDto(database, question),
      });
    });
  },

  deleteQuestion(examId, questionId) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const { exam, question } = requireTeacherOwnedQuestion(database, currentUser, questionId);

      if (Number(examId) !== question.examId) {
        throw createApiError("Câu hỏi này không thuộc đề thi hiện tại.", 400);
      }

      database.questions = database.questions.filter((questionItem) => questionItem.id !== question.id);
      database.answers = database.answers.filter((answer) => answer.questionId !== question.id);
      renumberExamQuestions(database, exam.id);

      appendActivityLog(database, {
        userId: currentUser.id,
        action: "QUESTION_DELETE",
        description: `Giảng viên ${currentUser.email} xóa một câu hỏi khỏi đề ${exam.title}.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Xóa câu hỏi thành công.",
        data: null,
      });
    });
  },

  delete(examId) {
    return executeMockRequest(() => {
      const database = readMockDatabase();
      const currentUser = requireCurrentUser(database);
      const exam = requireTeacherOwnedExam(database, currentUser, examId);
      const questionIds = database.questions
        .filter((question) => question.examId === exam.id)
        .map((question) => question.id);
      const attemptIds = database.examAttempts
        .filter((attempt) => attempt.examId === exam.id)
        .map((attempt) => attempt.id);

      database.exams = database.exams.filter((examItem) => examItem.id !== exam.id);
      database.examSettings = database.examSettings.filter((setting) => setting.examId !== exam.id);
      database.questions = database.questions.filter((question) => question.examId !== exam.id);
      database.answers = database.answers.filter((answer) => !questionIds.includes(answer.questionId));
      database.examAttempts = database.examAttempts.filter((attempt) => attempt.examId !== exam.id);
      database.cheatingLogs = database.cheatingLogs.filter(
        (logItem) => !attemptIds.includes(logItem.examAttemptId),
      );

      appendActivityLog(database, {
        userId: currentUser.id,
        action: "EXAM_DELETE",
        description: `Giảng viên ${currentUser.email} xóa bài kiểm tra ${exam.title}.`,
      });
      writeMockDatabase(database);

      return buildApiResponse({
        message: "Xóa bài kiểm tra thành công.",
        data: null,
      });
    });
  },
};
