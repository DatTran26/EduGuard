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

function normalizeExamQuestionSnapshot(question) {
  const answers = Array.isArray(question?.answers)
    ? question.answers.map((answer) => normalizeBankAnswer(answer)).sort((first, second) => first.orderIndex - second.orderIndex)
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

function translateMatrixMessage(message) {
  const normalizedMessage = String(message ?? "").trim();

  if (normalizedMessage === "Question bank does not have enough approved questions.") {
    return "Ngân hàng câu hỏi chưa có đủ câu hỏi Sẵn sàng khớp với ma trận.";
  }

  if (normalizedMessage === "Not enough approved questions for this matrix item.") {
    return "Không đủ câu hỏi Sẵn sàng cho dòng ma trận này.";
  }

  if (normalizedMessage === "Enough approved questions for this matrix item.") {
    return "Đủ câu hỏi Sẵn sàng cho dòng ma trận này.";
  }

  if (normalizedMessage === "Matrix is valid.") {
    return "Ma trận đủ câu hỏi để tạo đề.";
  }

  if (normalizedMessage === "Matrix question total does not match.") {
    return "Tổng số câu của ma trận chưa khớp với các dòng chi tiết.";
  }

  if (normalizedMessage === "Matrix score total does not match.") {
    return "Tổng điểm của ma trận chưa khớp với các dòng chi tiết.";
  }

  if (normalizedMessage === "Generated exam preview successfully.") {
    return "Đã tạo bản xem thử đề thành công.";
  }

  if (normalizedMessage === "Preview could not select enough distinct questions.") {
    return "Bản xem thử chưa chọn đủ câu hỏi không trùng nhau.";
  }

  return normalizedMessage;
}

function normalizeMatrixIssue(issue) {
  return {
    ...issue,
    matrixItemId: Number(issue?.matrixItemId) || null,
    subject: issue?.subject ?? "",
    chapter: issue?.chapter ?? "",
    lesson: issue?.lesson ?? "",
    learningOutcome: issue?.learningOutcome ?? "",
    questionType: issue?.questionType ? normalizeQuestionType(issue.questionType) : "",
    difficulty: issue?.difficulty ? normalizeDifficulty(issue.difficulty) : "",
    required: Number(issue?.required) || 0,
    available: Number(issue?.available) || 0,
    message: translateMatrixMessage(issue?.message),
  };
}

function normalizeMatrixValidation(result) {
  return {
    isValid: Boolean(result?.isValid),
    success: Boolean(result?.success ?? result?.isValid),
    message: translateMatrixMessage(result?.message),
    totalQuestions: Number(result?.totalQuestions) || 0,
    totalScore: Number(result?.totalScore) || 0,
    items: Array.isArray(result?.items) ? result.items.map((issue) => normalizeMatrixIssue(issue)) : [],
    errors: Array.isArray(result?.errors) ? result.errors.map((issue) => normalizeMatrixIssue(issue)) : [],
  };
}

function normalizeMatrixPreview(preview) {
  return {
    success: Boolean(preview?.success),
    message: translateMatrixMessage(preview?.message),
    totalQuestions: Number(preview?.totalQuestions) || 0,
    totalScore: Number(preview?.totalScore) || 0,
    hasSubstitutions: Boolean(preview?.hasSubstitutions),
    substitutionMessage: translateMatrixMessage(preview?.substitutionMessage),
    errors: Array.isArray(preview?.errors) ? preview.errors.map((issue) => normalizeMatrixIssue(issue)) : [],
    questions: Array.isArray(preview?.questions)
      ? preview.questions.map((item) => ({
          matrixItemId: Number(item?.matrixItemId) || 0,
          score: Number(item?.score) || 0,
          isSubstitution: Boolean(item?.isSubstitution),
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
  const totalQuestions = Number(payload.totalQuestions) || 0;
  const totalScore = Number(payload.totalScore) || 0;
  const scorePerQuestion = totalQuestions > 0 ? totalScore / totalQuestions : 0;

  return {
    name: payload.name?.trim() ?? "",
    subject: payload.subject?.trim() || null,
    gradeLevel: payload.gradeLevel?.trim() || null,
    totalQuestions,
    totalScore,
    durationMinutes: Number(payload.durationMinutes) || 0,
    items: Array.isArray(payload.items)
      ? payload.items.map((item) => ({
          chapter: item.chapter?.trim() || null,
          lesson: item.lesson?.trim() || null,
          learningOutcome: item.learningOutcome?.trim() || null,
          questionType: item.questionType ? toQuestionTypeCode(item.questionType) : null,
          difficulty: toDifficultyCode(item.difficulty),
          questionCount: Number(item.questionCount) || 0,
          scorePerQuestion,
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
    isPublished: payload.isPublished !== undefined ? Boolean(payload.isPublished) : true,
    settings: {
      shuffleQuestions: Boolean(payload.settings?.shuffleQuestions),
      shuffleAnswers: Boolean(payload.settings?.shuffleAnswers),
      maxAttempts: Number(payload.settings?.maxAttempts) || 1,
      showResultAfterSubmit: Boolean(payload.settings?.showResultAfterSubmit),
      requireFullscreen: Boolean(payload.settings?.requireFullscreen),
    },
    questions: Array.isArray(payload.questions)
      ? payload.questions.map((item, index) => ({
          matrixItemId: Number(item.matrixItemId) || 0,
          bankQuestionId: Number(item.bankQuestionId ?? item.question?.id) || 0,
          bankQuestionVersion: Number(item.bankQuestionVersion ?? item.question?.version) || null,
          content: item.content?.trim() ?? item.question?.content?.trim() ?? "",
          questionType: toQuestionTypeCode(item.questionType ?? item.question?.questionType),
          score: Number(item.score ?? item.question?.defaultScore) || 0,
          orderIndex: Number(item.orderIndex) || index + 1,
          answers: Array.isArray(item.answers ?? item.question?.answers)
            ? (item.answers ?? item.question.answers).map((answer, answerIndex) => ({
                content: answer.content?.trim() ?? "",
                isCorrect: Boolean(answer.isCorrect),
                orderIndex: Number(answer.orderIndex) || answerIndex + 1,
              }))
            : [],
        }))
      : [],
  };
}

function buildSnapshotQuestionsPayload(payload) {
  const startOrderIndex = Number(payload.startOrderIndex) || 0;

  return {
    bankQuestionIds: Array.isArray(payload.bankQuestionIds) ? payload.bankQuestionIds.map((id) => Number(id)).filter((id) => id > 0) : [],
    startOrderIndex: startOrderIndex > 0 ? startOrderIndex : null,
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

  async generateQuestionsAi(bankId, payload) {
    const apiResponse = await requestApi(() => axiosClient.post(`/question-banks/${bankId}/questions/generate-ai`, {
      prompt: payload.prompt,
      userApiKey: payload.userApiKey,
      difficulty: toDifficultyCode(payload.difficulty),
      status: toQuestionStatusCode(payload.status),
      subject: payload.subject?.trim() || null,
      chapter: payload.chapter?.trim() || null,
      lesson: payload.lesson?.trim() || null,
      learningOutcome: payload.learningOutcome?.trim() || null,
    }));

    return {
      ...apiResponse,
      data: {
        ...(apiResponse.data ?? {}),
        questions: Array.isArray(apiResponse.data?.questions)
          ? apiResponse.data.questions.map((question) => normalizeBankQuestion(question))
          : [],
      },
    };
  },

  async generateQuestionsAiPreview(bankId, payload) {
    const apiResponse = await requestApi(() => axiosClient.post(`/question-banks/${bankId}/questions/generate-ai/preview`, {
      prompt: payload.prompt,
      userApiKey: payload.userApiKey,
      difficulty: toDifficultyCode(payload.difficulty),
      status: toQuestionStatusCode(payload.status),
      subject: payload.subject?.trim() || null,
      chapter: payload.chapter?.trim() || null,
      lesson: payload.lesson?.trim() || null,
      learningOutcome: payload.learningOutcome?.trim() || null,
    }));

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data)
        ? apiResponse.data.map((question) => normalizeBankQuestion(question))
        : [],
    };
  },

  async createQuestionsBulk(bankId, questions) {
    const payload = questions.map((q) => ({
      content: q.content,
      questionType: toQuestionTypeCode(q.questionType),
      difficulty: toDifficultyCode(q.difficulty),
      defaultScore: Number(q.defaultScore) || 1,
      subject: q.subject?.trim() || null,
      chapter: q.chapter?.trim() || null,
      lesson: q.lesson?.trim() || null,
      learningOutcome: q.learningOutcome?.trim() || null,
      status: toQuestionStatusCode(q.status),
      answers: Array.isArray(q.answers)
        ? q.answers.map((a, idx) => ({
            content: a.content,
            isCorrect: Boolean(a.isCorrect),
            orderIndex: idx + 1,
          }))
        : [],
    }));

    const apiResponse = await requestApi(() => axiosClient.post(`/question-banks/${bankId}/questions/bulk`, payload));
    return {
      ...apiResponse,
      data: {
        ...(apiResponse.data ?? {}),
        questions: Array.isArray(apiResponse.data?.questions)
          ? apiResponse.data.questions.map((question) => normalizeBankQuestion(question))
          : [],
      },
    };
  },

  async getGptSettings() {
    return requestApi(() => axiosClient.get("/admin/gpt/settings"));
  },

  async saveGptSettings(payload) {
    return requestApi(() => axiosClient.post("/admin/gpt/settings", payload));
  },

  async testGptConnection(payload) {
    return requestApi(() => axiosClient.post("/admin/gpt/test-connection", payload));
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

  async snapshotQuestionsToExam(examId, payload) {
    const apiResponse = await requestApi(() => axiosClient.post(`/exams/${examId}/bank-questions`, buildSnapshotQuestionsPayload(payload)));

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data) ? apiResponse.data.map((question) => normalizeExamQuestionSnapshot(question)) : [],
    };
  },
};

export const questionBankEnums = {
  difficultyOptions: [
    { label: "Dễ", value: "Easy" },
    { label: "Trung bình", value: "Medium" },
    { label: "Khó", value: "Hard" },
  ],
  statusOptions: [
    { label: "Nháp", value: "Draft" },
    { label: "Cần rà soát", value: "Reviewed" },
    { label: "Sẵn sàng", value: "Approved" },
    { label: "Lưu trữ", value: "Archived" },
  ],
};
