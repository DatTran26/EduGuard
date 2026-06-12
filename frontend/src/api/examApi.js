import axiosClient from "./axiosClient";
import {
  buildExamStatusLabel,
  getCurrentSessionUser,
  normalizeQuestionType,
  requestApi,
  roundToOneDecimal,
  toQuestionTypeCode,
} from "./apiHelpers";

// INTEGRATION STATUS:
// - File này đã nối exam API thật của backend cho list/detail, CRUD đề thi, publish và question bank.
// - Vì backend chưa có endpoint "lấy tất cả đề thi", frontend sẽ gom đề thi bằng cách duyệt các classroom mà user đang thấy.
// - Một số số liệu như điểm trung bình hoặc tổng điểm sẽ được suy ra thêm ở FE khi có dữ liệu attempt/question tương ứng.

function normalizeExamSetting(settings) {
  return {
    shuffleQuestions: Boolean(settings?.shuffleQuestions),
    shuffleAnswers: Boolean(settings?.shuffleAnswers),
    maxAttempts: Number(settings?.maxAttempts) || 1,
    showResultAfterSubmit: Boolean(settings?.showResultAfterSubmit),
    requireFullscreen: Boolean(settings?.requireFullscreen),
  };
}

function sortByOrderIndex(firstItem, secondItem) {
  const firstOrderIndex = Number(firstItem?.orderIndex) || 0;
  const secondOrderIndex = Number(secondItem?.orderIndex) || 0;

  if (firstOrderIndex !== secondOrderIndex) {
    return firstOrderIndex - secondOrderIndex;
  }

  return (Number(firstItem?.id) || 0) - (Number(secondItem?.id) || 0);
}

function sortExamItemsByCreatedAt(firstExam, secondExam) {
  return new Date(secondExam.createdAt || 0) - new Date(firstExam.createdAt || 0);
}

function normalizeAnswerDto(answer) {
  return {
    id: Number(answer?.id) || 0,
    content: answer?.content ?? "",
    isCorrect: Boolean(answer?.isCorrect),
    orderIndex: Number(answer?.orderIndex) || 0,
  };
}

function normalizeQuestionDto(question) {
  const answers = Array.isArray(question?.answers)
    ? question.answers.map((answer) => normalizeAnswerDto(answer)).sort(sortByOrderIndex)
    : [];

  return {
    id: Number(question?.id) || 0,
    examId: Number(question?.examId) || 0,
    content: question?.content ?? "",
    questionType: normalizeQuestionType(question?.questionType),
    score: Number(question?.score) || 0,
    orderIndex: Number(question?.orderIndex) || 1,
    answerCount: answers.length,
    correctAnswerCount: answers.filter((answer) => answer.isCorrect).length,
    answers,
  };
}

function calculateTotalQuestionScore(questions = []) {
  return roundToOneDecimal(
    questions.reduce((totalValue, question) => totalValue + Number(question.score || 0), 0),
  );
}

function normalizeExamDto(exam, currentUser, classroom = null, extraData = {}) {
  const isTeacherOwner =
    currentUser?.role === "Teacher" && Number(currentUser.id) === Number(exam?.teacherId);
  const canViewQuestionBank = currentUser?.role === "Admin" || isTeacherOwner;

  return {
    id: Number(exam?.id) || 0,
    classroomId: Number(exam?.classroomId) || 0,
    classroomName: classroom?.name ?? "Lớp học chưa xác định",
    teacherId: Number(exam?.teacherId) || 0,
    teacherName:
      classroom?.teacherName ||
      (Number(currentUser?.id) === Number(exam?.teacherId) ? currentUser?.fullName : "") ||
      "Giảng viên chưa xác định",
    title: exam?.title ?? "",
    description: exam?.description ?? "",
    durationMinutes: Number(exam?.durationMinutes) || 0,
    startTime: exam?.startTime ?? null,
    endTime: exam?.endTime ?? null,
    isPublished: Boolean(exam?.isPublished),
    enableAntiCheat: Boolean(exam?.enableAntiCheat),
    createdAt: exam?.createdAt ?? null,
    updatedAt: extraData.updatedAt ?? exam?.createdAt ?? null,
    statusLabel: buildExamStatusLabel({
      isPublished: Boolean(exam?.isPublished),
      startTime: exam?.startTime ?? null,
      endTime: exam?.endTime ?? null,
    }),
    questionCount: Number(exam?.questionCount) || 0,
    totalQuestionScore:
      typeof extraData.totalQuestionScore === "number" ? extraData.totalQuestionScore : null,
    attemptCount: Number(exam?.attemptCount) || 0,
    averageScore:
      typeof extraData.averageScore === "number" ? roundToOneDecimal(extraData.averageScore) : null,
    settings: normalizeExamSetting(exam?.settings),
    canEdit: isTeacherOwner,
    canDelete: isTeacherOwner,
    canViewQuestionBank,
  };
}

function buildExamWritePayload(payload) {
  return {
    title: payload.title?.trim() ?? "",
    description: payload.description?.trim() || null,
    durationMinutes: Number(payload.durationMinutes) || 0,
    startTime: payload.startTime || null,
    endTime: payload.endTime || null,
    enableAntiCheat: Boolean(payload.enableAntiCheat),
    settings: normalizeExamSetting(payload.settings),
  };
}

function buildQuestionWritePayload(payload) {
  return {
    content: payload.content?.trim() ?? "",
    questionType: toQuestionTypeCode(payload.questionType),
    score: Number(payload.score) || 0,
    orderIndex: Number(payload.orderIndex) || 1,
    answers: Array.isArray(payload.answers)
      ? payload.answers.map((answer, index) => ({
          id: answer.id ?? null,
          content: answer.content?.trim() ?? "",
          isCorrect: Boolean(answer.isCorrect),
          orderIndex: index + 1,
        }))
      : [],
  };
}

async function getClassroomById(classroomId) {
  const apiResponse = await requestApi(() => axiosClient.get(`/classrooms/${classroomId}`));
  return apiResponse.data;
}

async function tryGetClassroomById(classroomId) {
  try {
    return await getClassroomById(classroomId);
  } catch {
    return null;
  }
}

async function getRawExamListByClassroom(classroomId) {
  const apiResponse = await requestApi(() => axiosClient.get(`/classrooms/${classroomId}/exams`));
  return apiResponse.data;
}

async function getNormalizedExamById(examId, extraData = {}) {
  const currentUser = getCurrentSessionUser();
  const apiResponse = await requestApi(() => axiosClient.get(`/exams/${examId}`));
  const classroom = await tryGetClassroomById(apiResponse.data?.classroomId);

  return {
    ...apiResponse,
    data: normalizeExamDto(apiResponse.data, currentUser, classroom, extraData),
  };
}

async function maybePublishExam(examId, shouldPublish) {
  if (!shouldPublish) {
    return null;
  }

  return requestApi(() => axiosClient.post(`/exams/${examId}/publish`));
}

export const examApi = {
  async getAll(filters = {}) {
    const currentUser = getCurrentSessionUser();
    const classroomId = Number(filters.classroomId) || 0;

    if (classroomId > 0) {
      const [classroom, examItems] = await Promise.all([
        tryGetClassroomById(classroomId),
        getRawExamListByClassroom(classroomId),
      ]);

      return {
        success: true,
        message: "Lấy danh sách bài kiểm tra thành công.",
        data: (Array.isArray(examItems) ? examItems : [])
          .map((exam) => normalizeExamDto(exam, currentUser, classroom))
          .sort(sortExamItemsByCreatedAt),
      };
    }

    const classroomResponse = await requestApi(() => axiosClient.get("/classrooms"));
    const classrooms = Array.isArray(classroomResponse.data) ? classroomResponse.data : [];
    const examGroups = await Promise.all(
      classrooms.map(async (classroom) => {
        try {
          const examItems = await getRawExamListByClassroom(classroom.id);

          return (Array.isArray(examItems) ? examItems : []).map((exam) =>
            normalizeExamDto(exam, currentUser, classroom),
          );
        } catch {
          return [];
        }
      }),
    );

    return {
      success: true,
      message: "Lấy danh sách bài kiểm tra thành công.",
      data: examGroups.flat().sort(sortExamItemsByCreatedAt),
    };
  },

  async getById(examId) {
    return getNormalizedExamById(examId);
  },

  async getQuestionList(examId) {
    const apiResponse = await requestApi(() => axiosClient.get(`/exams/${examId}/questions`));

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data)
        ? apiResponse.data.map((question) => normalizeQuestionDto(question)).sort(sortByOrderIndex)
        : [],
    };
  },

  async create(payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.post(`/classrooms/${payload.classroomId}/exams`, buildExamWritePayload(payload)),
    );

    const publishResponse = await maybePublishExam(apiResponse.data?.id, Boolean(payload.isPublished));
    const normalizedResponse = await getNormalizedExamById(apiResponse.data?.id);

    return {
      ...normalizedResponse,
      message: publishResponse?.message || apiResponse.message,
    };
  },

  async update(examId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.put(`/exams/${examId}`, buildExamWritePayload(payload)),
    );

    const publishResponse = await maybePublishExam(examId, Boolean(payload.isPublished));
    const normalizedResponse = await getNormalizedExamById(apiResponse.data?.id || examId);

    return {
      ...normalizedResponse,
      message: publishResponse?.message || apiResponse.message,
    };
  },

  async publish(examId) {
    const apiResponse = await requestApi(() => axiosClient.post(`/exams/${examId}/publish`));
    const normalizedResponse = await getNormalizedExamById(apiResponse.data?.id || examId);

    return {
      ...normalizedResponse,
      message: apiResponse.message,
    };
  },

  async createQuestion(examId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.post(`/exams/${examId}/questions`, buildQuestionWritePayload(payload)),
    );

    return {
      ...apiResponse,
      data: normalizeQuestionDto(apiResponse.data),
    };
  },

  async updateQuestion(_examId, questionId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.put(`/questions/${questionId}`, buildQuestionWritePayload(payload)),
    );

    return {
      ...apiResponse,
      data: normalizeQuestionDto(apiResponse.data),
    };
  },

  async deleteQuestion(_examId, questionId) {
    const apiResponse = await requestApi(() => axiosClient.delete(`/questions/${questionId}`));

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },

  async delete(examId) {
    const apiResponse = await requestApi(() => axiosClient.delete(`/exams/${examId}`));

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },

  calculateTotalQuestionScore,
};
