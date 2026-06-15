import { formatShortDateTime } from "../../utils/formatDate";

export function buildAttemptAnswerState(savedAnswers = []) {
  return savedAnswers.reduce((accumulator, answer) => ({
    ...accumulator,
    [answer.questionId]: {
      answerIds: Array.isArray(answer.answerIds) ? answer.answerIds : [],
      textAnswer: answer.textAnswer ?? "",
    },
  }), {});
}

export function getAttemptAnswerPayload(question, answerState) {
  const basePayload = {
    questionId: question.id,
    answerIds: [],
    textAnswer: null,
  };

  if (!answerState) {
    return basePayload;
  }

  if (question.questionType === "ShortAnswer") {
    return {
      ...basePayload,
      textAnswer: answerState.textAnswer?.trim() || null,
    };
  }

  return {
    ...basePayload,
    answerIds: Array.isArray(answerState.answerIds) ? answerState.answerIds : [],
  };
}

export function isAttemptAnswerPayloadReady(question, payload) {
  if (question.questionType === "ShortAnswer") {
    return Boolean(payload.textAnswer?.trim());
  }

  return Array.isArray(payload.answerIds) && payload.answerIds.length > 0;
}

export function isQuestionAnswered(question, answerState) {
  if (!question || !answerState) {
    return false;
  }

  if (question.questionType === "ShortAnswer") {
    return Boolean(answerState.textAnswer?.trim());
  }

  return Array.isArray(answerState.answerIds) && answerState.answerIds.length > 0;
}

export function countAnsweredQuestions(questions = [], answersByQuestionId = {}) {
  return questions.filter((question) =>
    isQuestionAnswered(question, answersByQuestionId[question.id]),
  ).length;
}

export function calculateAttemptEndTime(attempt, durationMinutes) {
  if (!attempt?.startedAt || !durationMinutes) {
    return null;
  }

  return new Date(attempt.startedAt).getTime() + Number(durationMinutes) * 60 * 1000;
}

export function formatRemainingDuration(remainingMs) {
  if (remainingMs <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

export function getRemainingTimeVariant(remainingMs) {
  if (remainingMs <= 5 * 60 * 1000) {
    return "caution";
  }

  return "info";
}

export function formatSaveBanner(saveState) {
  if (saveState.status === "saving") {
    return "Đang lưu...";
  }

  if (saveState.status === "error") {
    return saveState.message || "Lỗi lưu, thử lại";
  }

  if (saveState.lastSavedAt) {
    return `Đã lưu lúc ${formatShortDateTime(saveState.lastSavedAt)}`;
  }

  return "Chưa có bản lưu";
}
