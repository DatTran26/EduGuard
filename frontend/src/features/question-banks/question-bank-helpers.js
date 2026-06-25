import { questionBankEnums } from "../../api/questionBankApi";
import { QUESTION_TYPE_OPTIONS } from "../exams/examHelpers";

export const QUESTION_TYPE_FILTER_OPTIONS = [
  { label: "Tất cả loại câu", value: "" },
  ...QUESTION_TYPE_OPTIONS,
];

export const MATRIX_QUESTION_TYPE_OPTIONS = [
  { label: "Bất kỳ", value: "" },
  ...QUESTION_TYPE_OPTIONS,
];

export const QUESTION_STATUS_FILTER_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  ...questionBankEnums.statusOptions,
];

export const EMPTY_BANK_FORM = {
  name: "",
  description: "",
  subject: "",
  gradeLevel: "",
};

export const EMPTY_IMPORT_DEFAULTS = {
  difficulty: "Medium",
  status: "Approved",
  subject: "",
  chapter: "",
  lesson: "",
  learningOutcome: "",
};

export const EMPTY_MATRIX_ITEM = {
  chapter: "",
  lesson: "",
  learningOutcome: "",
  questionType: "",
  difficulty: "Medium",
  questionCount: 1,
  scorePerQuestion: 1,
};

export const EMPTY_MATRIX_FORM = {
  id: null,
  name: "",
  subject: "",
  gradeLevel: "",
  durationMinutes: 45,
  items: [{ ...EMPTY_MATRIX_ITEM }],
};

export const EMPTY_CREATE_EXAM_FORM = {
  matrixId: "",
  classroomId: "",
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  enableAntiCheat: true,
  settings: {
    shuffleQuestions: true,
    shuffleAnswers: true,
    maxAttempts: 1,
    showResultAfterSubmit: true,
    requireFullscreen: false,
  },
};

export function buildDefaultAnswers(questionType) {
  if (questionType === "TrueFalse") {
    return [
      { content: "Đúng", isCorrect: true },
      { content: "Sai", isCorrect: false },
    ];
  }

  if (questionType === "ShortAnswer") {
    return [{ content: "", isCorrect: true }];
  }

  return [
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
  ];
}

export function buildEmptyQuestionForm(bank = null) {
  return {
    id: null,
    content: "",
    questionType: "SingleChoice",
    difficulty: "Medium",
    defaultScore: 1,
    subject: bank?.subject ?? "",
    chapter: "",
    lesson: "",
    learningOutcome: "",
    status: "Approved",
    answers: buildDefaultAnswers("SingleChoice"),
  };
}

export function buildQuestionFormFromQuestion(question) {
  return {
    id: question.id,
    content: question.content,
    questionType: question.questionType,
    difficulty: question.difficulty,
    defaultScore: question.defaultScore,
    subject: question.subject,
    chapter: question.chapter,
    lesson: question.lesson,
    learningOutcome: question.learningOutcome,
    status: question.status,
    answers: question.answers.length > 0 ? question.answers.map((answer) => ({ ...answer })) : buildDefaultAnswers(question.questionType),
  };
}

export function buildMatrixFormFromMatrix(matrix) {
  return {
    id: matrix.id,
    name: matrix.name,
    subject: matrix.subject,
    gradeLevel: matrix.gradeLevel,
    durationMinutes: matrix.durationMinutes || 45,
    items: matrix.items.length > 0 ? matrix.items.map((item) => ({ ...item })) : [{ ...EMPTY_MATRIX_ITEM }],
  };
}

export function calculateMatrixTotals(items = []) {
  return items.reduce(
    (summary, item) => {
      const questionCount = Number(item.questionCount) || 0;
      const scorePerQuestion = Number(item.scorePerQuestion) || 0;

      return {
        totalQuestions: summary.totalQuestions + questionCount,
        totalScore: summary.totalScore + questionCount * scorePerQuestion,
      };
    },
    { totalQuestions: 0, totalScore: 0 },
  );
}

export function getDifficultyLabel(value) {
  return questionBankEnums.difficultyOptions.find((option) => option.value === value)?.label ?? "Trung bình";
}

export function getStatusLabel(value) {
  return questionBankEnums.statusOptions.find((option) => option.value === value)?.label ?? "Nháp";
}

export function getStatusBadgeVariant(value) {
  if (value === "Approved") {
    return "success";
  }

  if (value === "Archived") {
    return "neutral";
  }

  if (value === "Reviewed") {
    return "info";
  }

  return "caution";
}

export function buildBankQuestionFilters(filters) {
  return {
    keyword: filters.keyword || undefined,
    difficulty: filters.difficulty || undefined,
    questionType: filters.questionType || undefined,
    status: filters.status || undefined,
    chapter: filters.chapter || undefined,
  };
}
