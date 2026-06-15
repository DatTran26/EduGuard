import axiosClient from "./axiosClient";
import {
  normalizeAttemptStatus,
  normalizeQuestionType,
  requestApi,
  roundToOneDecimal,
} from "./apiHelpers";

// INTEGRATION STATUS:
// - File này đã map các endpoint exam attempt thật của backend cho luồng start / save / submit / result.
// - FE chưa có màn hình làm bài riêng, nhưng teacher detail và các bước tiếp theo đã có client sẵn để nối.

function normalizeAnswerDto(answer) {
  return {
    id: Number(answer?.id) || 0,
    content: answer?.content ?? "",
    isCorrect: Boolean(answer?.isCorrect),
    orderIndex: Number(answer?.orderIndex) || 0,
  };
}

function normalizeQuestionDto(question) {
  return {
    id: Number(question?.id) || 0,
    examId: Number(question?.examId) || 0,
    content: question?.content ?? "",
    questionType: normalizeQuestionType(question?.questionType),
    score: Number(question?.score) || 0,
    orderIndex: Number(question?.orderIndex) || 1,
    answers: Array.isArray(question?.answers)
      ? question.answers.map((answer) => normalizeAnswerDto(answer))
      : [],
  };
}

function normalizeAttemptDto(attempt) {
  return {
    id: Number(attempt?.id) || 0,
    examId: Number(attempt?.examId) || 0,
    studentId: Number(attempt?.studentId) || 0,
    studentName: attempt?.studentName ?? "",
    startedAt: attempt?.startedAt ?? null,
    submittedAt: attempt?.submittedAt ?? null,
    score: typeof attempt?.score === "number" ? roundToOneDecimal(attempt.score) : null,
    suspicionScore: Number(attempt?.suspicionScore) || 0,
    status: normalizeAttemptStatus(attempt?.status),
  };
}

function normalizeSavedAnswerDto(answer) {
  return {
    questionId: Number(answer?.questionId) || 0,
    answerIds: Array.isArray(answer?.answerIds) ? answer.answerIds.map((id) => Number(id) || 0) : [],
    textAnswer: answer?.textAnswer ?? "",
  };
}

function normalizeQuestionResultDto(questionResult) {
  return {
    questionId: Number(questionResult?.questionId) || 0,
    content: questionResult?.content ?? "",
    score: Number(questionResult?.score) || 0,
    earnedScore: Number(questionResult?.earnedScore) || 0,
    isCorrect: Boolean(questionResult?.isCorrect),
    selectedAnswerIds: Array.isArray(questionResult?.selectedAnswerIds)
      ? questionResult.selectedAnswerIds.map((id) => Number(id) || 0)
      : [],
    textAnswer: questionResult?.textAnswer ?? "",
  };
}

export const examAttemptApi = {
  async start(examId) {
    const apiResponse = await requestApi(() => axiosClient.post(`/exams/${examId}/start`));

    return {
      ...apiResponse,
      data: {
        attempt: normalizeAttemptDto(apiResponse.data?.attempt),
        questions: Array.isArray(apiResponse.data?.questions)
          ? apiResponse.data.questions.map((question) => normalizeQuestionDto(question))
          : [],
        durationMinutes: Number(apiResponse.data?.durationMinutes) || 0,
      },
    };
  },

  async getById(attemptId) {
    const apiResponse = await requestApi(() => axiosClient.get(`/attempts/${attemptId}`));

    return {
      ...apiResponse,
      data: {
        ...normalizeAttemptDto(apiResponse.data),
        questions: Array.isArray(apiResponse.data?.questions)
          ? apiResponse.data.questions.map((question) => normalizeQuestionDto(question))
          : [],
        savedAnswers: Array.isArray(apiResponse.data?.savedAnswers)
          ? apiResponse.data.savedAnswers.map((answer) => normalizeSavedAnswerDto(answer))
          : [],
      },
    };
  },

  async saveAnswer(attemptId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.post(`/attempts/${attemptId}/answers`, {
        questionId: Number(payload.questionId) || 0,
        answerIds: Array.isArray(payload.answerIds)
          ? payload.answerIds.map((answerId) => Number(answerId) || 0)
          : [],
        textAnswer: payload.textAnswer?.trim() || null,
      }),
    );

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },

  async submit(attemptId) {
    const apiResponse = await requestApi(() => axiosClient.post(`/attempts/${attemptId}/submit`));

    return {
      ...apiResponse,
      data: {
        attempt: normalizeAttemptDto(apiResponse.data?.attempt),
        questions: Array.isArray(apiResponse.data?.questions)
          ? apiResponse.data.questions.map((question) => normalizeQuestionResultDto(question))
          : [],
      },
    };
  },

  async getResult(attemptId) {
    const apiResponse = await requestApi(() => axiosClient.get(`/attempts/${attemptId}/result`));

    return {
      ...apiResponse,
      data: {
        attempt: normalizeAttemptDto(apiResponse.data?.attempt),
        questions: Array.isArray(apiResponse.data?.questions)
          ? apiResponse.data.questions.map((question) => normalizeQuestionResultDto(question))
          : [],
      },
    };
  },

  async getByExam(examId) {
    const apiResponse = await requestApi(() => axiosClient.get(`/exams/${examId}/attempts`));

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data)
        ? apiResponse.data.map((attempt) => normalizeAttemptDto(attempt))
        : [],
    };
  },
};
