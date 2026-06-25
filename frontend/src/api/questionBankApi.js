import axiosClient from "./axiosClient";
import {
  buildClientError,
  normalizeQuestionType,
  requestApi,
  toQuestionTypeCode,
  unwrapApiResponse,
} from "./apiHelpers";

const DIFFICULTY_VALUE_BY_CODE = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

const DIFFICULTY_CODE_BY_VALUE = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

const QUESTION_STATUS_VALUE_BY_CODE = {
  1: "Draft",
  2: "Reviewed",
  3: "Approved",
  4: "Archived",
};

const QUESTION_STATUS_CODE_BY_VALUE = {
  Draft: 1,
  Reviewed: 2,
  Approved: 3,
  Archived: 4,
};

function normalizeDifficulty(value) {
  if (typeof value === "string" && DIFFICULTY_CODE_BY_VALUE[value]) {
    return value;
  }

  return DIFFICULTY_VALUE_BY_CODE[Number(value)] ?? "Medium";
}

function toDifficultyCode(value) {
  if (typeof value === "number") {
    return value;
  }

  return DIFFICULTY_CODE_BY_VALUE[value] ?? DIFFICULTY_CODE_BY_VALUE.Medium;
}

function normalizeQuestionStatus(value) {
  if (typeof value === "string" && QUESTION_STATUS_CODE_BY_VALUE[value]) {
    return value;
  }

  return QUESTION_STATUS_VALUE_BY_CODE[Number(value)] ?? "Draft";
}

function toQuestionStatusCode(value) {
  if (typeof value === "number") {
    return value;
  }

  return QUESTION_STATUS_CODE_BY_VALUE[value] ?? QUESTION_STATUS_CODE_BY_VALUE.Draft;
}

function normalizeBankAnswer(answer) {
  return {
    id: Number(answer?.id) || 0,
    content: answer?.content ?? "",
    isCorrect: Boolean(answer?.isCorrect),
    orderIndex: Number(answer?.orderIndex) || 0,
  };
}

function normalizeBankQuestion(question) {
  const answers = Array.isArray(question?.answers)
    ? question.answers.map((answer) => normalizeBankAnswer(answer)).sort((first, second) => first.orderIndex - second.orderIndex)
    : [];

  return {
    id: Number(question?.id) || 0,
    questionBankId: Number(question?.questionBankId) || 0,
    content: question?.content ?? "",
    questionType: normalizeQuestionType(question?.questionType),
    difficulty: normalizeDifficulty(question?.difficulty),
    defaultScore: Number(question?.defaultScore) || 0,
    subject: question?.subject ?? "",
    chapter: question?.chapter ?? "",
    lesson: question?.lesson ?? "",
    learningOutcome: question?.learningOutcome ?? "",
    status: normalizeQuestionStatus(question?.status),
    version: Number(question?.version) || 1,
    parentQuestionId: Number(question?.parentQuestionId) || null,
    timesUsed: Number(question?.timesUsed) || 0,
    createdAt: question?.createdAt ?? null,
    updatedAt: question?.updatedAt ?? null,
    answers,
  };
}

function normalizeQuestionBank(bank) {
  return {
    id: Number(bank?.id) || 0,
    name: bank?.name ?? "",
    description: bank?.description ?? "",
    subject: bank?.subject ?? "",
    gradeLevel: bank?.gradeLevel ?? "",
    questionCount: Number(bank?.questionCount) || 0,
    createdAt: bank?.createdAt ?? null,
    updatedAt: bank?.updatedAt ?? null,
  };
}

function normalizeMatrixItem(item) {
  return {
    id: Number(item?.id) || 0,
    examMatrixId: Number(item?.examMatrixId) || 0,
    chapter: item?.chapter ?? "",
    lesson: item?.lesson ?? "",
    learningOutcome: item?.learningOutcome ?? "",
    questionType: item?.questionType ? normalizeQuestionType(item.questionType) : "",
    difficulty: normalizeDifficulty(item?.difficulty),
    questionCount: Number(item?.questionCount) || 1,
    scorePerQuestion: Number(item?.scorePerQuestion) || 1,
  };
}

function normalizeExamMatrix(matrix) {
  return {
    id: Number(matrix?.id) || 0,
    name: matrix?.name ?? "",
    subject: matrix?.subject ?? "",
    gradeLevel: matrix?.gradeLevel ?? "",
    totalQuestions: Number(matrix?.totalQuestions) || 0,
    totalScore: Number(matrix?.totalScore) || 0,
    durationMinutes: Number(matrix?.durationMinutes) || 0,
    createdAt: matrix?.createdAt ?? null,
    updatedAt: matrix?.updatedAt ?? null,
    items: Array.isArray(matrix?.items) ? matrix.items.map((item) => normalizeMatrixItem(item)) : [],
  };
}

function normalizeMatrixValidation(result) {
  return {
    isValid: Boolean(result?.isValid),
    success: Boolean(result?.success ?? result?.isValid),
    message: result?.message ?? "",
    totalQuestions: Number(result?.totalQuestions) || 0,
    totalScore: Number(result?.totalScore) || 0,
    errors: Array.isArray(result?.errors) ? result.errors : [],
  };
}

function normalizeMatrixPreview(preview) {
  return {
    success: Boolean(preview?.success),
    message: preview?.message ?? "",
    totalQuestions: Number(preview?.totalQuestions) || 0,
    totalScore: Number(preview?.totalScore) || 0,
    errors: Array.isArray(preview?.errors) ? preview.errors : [],
    questions: Array.isArray(preview?.questions)
      ? preview.questions.map((item) => ({
          matrixItemId: Number(item?.matrixItemId) || 0,
          score: Number(item?.score) || 0,
          question: normalizeBankQuestion(item?.question),
        }))
      : [],
  };
}

function buildQuestionBankPayload(payload) {
  return {
    name: payload.name?.trim() ?? "",
    description: payload.description?.trim() || null,
    subject: payload.subject?.trim() || null,
    gradeLevel: payload.gradeLevel?.trim() || null,
  };
}

function buildBankQuestionPayload(payload) {
  return {
    content: payload.content?.trim() ?? "",
    questionType: toQuestionTypeCode(payload.questionType),
    difficulty: toDifficultyCode(payload.difficulty),
    defaultScore: Number(payload.defaultScore) || 0,
    subject: payload.subject?.trim() || null,
    chapter: payload.chapter?.trim() || null,
    lesson: payload.lesson?.trim() || null,
    learningOutcome: payload.learningOutcome?.trim() || null,
    status: toQuestionStatusCode(payload.status),
    answers: Array.isArray(payload.answers)
      ? payload.answers.map((answer) => ({
          content: answer.content?.trim() ?? "",
          isCorrect: Boolean(answer.isCorrect),
        }))
      : [],
  };
}

function buildMatrixPayload(payload) {
  return {
    name: payload.name?.trim() ?? "",
    subject: payload.subject?.trim() || null,
    gradeLevel: payload.gradeLevel?.trim() || null,
    totalQuestions: Number(payload.totalQuestions) || 0,
    totalScore: Number(payload.totalScore) || 0,
    durationMinutes: Number(payload.durationMinutes) || 0,
    items: Array.isArray(payload.items)
      ? payload.items.map((item) => ({
          chapter: item.chapter?.trim() || null,
          lesson: item.lesson?.trim() || null,
          learningOutcome: item.learningOutcome?.trim() || null,
          questionType: item.questionType ? toQuestionTypeCode(item.questionType) : null,
          difficulty: toDifficultyCode(item.difficulty),
          questionCount: Number(item.questionCount) || 0,
          scorePerQuestion: Number(item.scorePerQuestion) || 0,
        }))
      : [],
  };
}

function buildCreateExamFromMatrixPayload(payload) {
  return {
    questionBankId: Number(payload.questionBankId) || 0,
    classroomId: Number(payload.classroomId) || 0,
    title: payload.title?.trim() ?? "",
    description: payload.description?.trim() || null,
    startTime: payload.startTime || null,
    endTime: payload.endTime || null,
    enableAntiCheat: Boolean(payload.enableAntiCheat),
    settings: {
      shuffleQuestions: Boolean(payload.settings?.shuffleQuestions),
      shuffleAnswers: Boolean(payload.settings?.shuffleAnswers),
      maxAttempts: Number(payload.settings?.maxAttempts) || 1,
      showResultAfterSubmit: Boolean(payload.settings?.showResultAfterSubmit),
      requireFullscreen: Boolean(payload.settings?.requireFullscreen),
    },
  };
}

export const questionBankApi = {
  async getBanks() {
    const apiResponse = await requestApi(() => axiosClient.get("/question-banks"));

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data) ? apiResponse.data.map((bank) => normalizeQuestionBank(bank)) : [],
    };
  },

  async createBank(payload) {
    const apiResponse = await requestApi(() => axiosClient.post("/question-banks", buildQuestionBankPayload(payload)));
    return { ...apiResponse, data: normalizeQuestionBank(apiResponse.data) };
  },

  async updateBank(bankId, payload) {
    const apiResponse = await requestApi(() => axiosClient.put(`/question-banks/${bankId}`, buildQuestionBankPayload(payload)));
    return { ...apiResponse, data: normalizeQuestionBank(apiResponse.data) };
  },

  async deleteBank(bankId) {
    return requestApi(() => axiosClient.delete(`/question-banks/${bankId}`));
  },

  async getQuestions(bankId, filters = {}) {
    const apiResponse = await requestApi(() => axiosClient.get(`/question-banks/${bankId}/questions`, { params: filters }));

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data) ? apiResponse.data.map((question) => normalizeBankQuestion(question)) : [],
    };
  },

  async createQuestion(bankId, payload) {
    const apiResponse = await requestApi(() => axiosClient.post(`/question-banks/${bankId}/questions`, buildBankQuestionPayload(payload)));
    return { ...apiResponse, data: normalizeBankQuestion(apiResponse.data) };
  },

  async updateQuestion(questionId, payload) {
    const apiResponse = await requestApi(() => axiosClient.put(`/bank-questions/${questionId}`, buildBankQuestionPayload(payload)));
    return { ...apiResponse, data: normalizeBankQuestion(apiResponse.data) };
  },

  async archiveQuestion(questionId) {
    return requestApi(() => axiosClient.post(`/bank-questions/${questionId}/archive`));
  },

  async importQuestions(bankId, file, defaults = {}) {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("Difficulty", toDifficultyCode(defaults.difficulty));
    formData.append("Status", toQuestionStatusCode(defaults.status));
    formData.append("Subject", defaults.subject?.trim() || "");
    formData.append("Chapter", defaults.chapter?.trim() || "");
    formData.append("Lesson", defaults.lesson?.trim() || "");
    formData.append("LearningOutcome", defaults.learningOutcome?.trim() || "");

    try {
      const response = await axiosClient.post(`/question-banks/${bankId}/questions/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const apiResponse = unwrapApiResponse(response);

      return {
        ...apiResponse,
        data: {
          ...(apiResponse.data ?? {}),
          questions: Array.isArray(apiResponse.data?.questions)
            ? apiResponse.data.questions.map((question) => normalizeBankQuestion(question))
            : [],
        },
      };
    } catch (error) {
      const nextError = buildClientError(error);
      nextError.importResult = error.response?.data?.data ?? null;
      throw nextError;
    }
  },

  async getMatrices() {
    const apiResponse = await requestApi(() => axiosClient.get("/exam-matrices"));

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data) ? apiResponse.data.map((matrix) => normalizeExamMatrix(matrix)) : [],
    };
  },

  async createMatrix(payload) {
    const apiResponse = await requestApi(() => axiosClient.post("/exam-matrices", buildMatrixPayload(payload)));
    return { ...apiResponse, data: normalizeExamMatrix(apiResponse.data) };
  },

  async updateMatrix(matrixId, payload) {
    const apiResponse = await requestApi(() => axiosClient.put(`/exam-matrices/${matrixId}`, buildMatrixPayload(payload)));
    return { ...apiResponse, data: normalizeExamMatrix(apiResponse.data) };
  },

  async deleteMatrix(matrixId) {
    return requestApi(() => axiosClient.delete(`/exam-matrices/${matrixId}`));
  },

  async validateMatrix(matrixId, questionBankId) {
    const apiResponse = await requestApi(() => axiosClient.post(`/exam-matrices/${matrixId}/validate`, null, { params: { questionBankId } }));
    return { ...apiResponse, data: normalizeMatrixValidation(apiResponse.data) };
  },

  async generateMatrixPreview(matrixId, questionBankId) {
    const apiResponse = await requestApi(() => axiosClient.post(`/exam-matrices/${matrixId}/generate-preview`, null, { params: { questionBankId } }));
    return { ...apiResponse, data: normalizeMatrixPreview(apiResponse.data) };
  },

  async createExamFromMatrix(matrixId, payload) {
    return requestApi(() => axiosClient.post(`/exam-matrices/${matrixId}/create-exam`, buildCreateExamFromMatrixPayload(payload)));
  },
};

export const questionBankEnums = {
  difficultyOptions: [
    { label: "De", value: "Easy" },
    { label: "Trung binh", value: "Medium" },
    { label: "Kho", value: "Hard" },
  ],
  statusOptions: [
    { label: "Nhap", value: "Draft" },
    { label: "Da review", value: "Reviewed" },
    { label: "Da duyet", value: "Approved" },
    { label: "Luu tru", value: "Archived" },
  ],
};
