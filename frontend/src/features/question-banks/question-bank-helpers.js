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
  totalScore: 10,
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
    totalScore: matrix.totalScore || 10,
    items: matrix.items.length > 0 ? matrix.items.map((item) => ({ ...item })) : [{ ...EMPTY_MATRIX_ITEM }],
  };
}

export function calculateMatrixTotals(items = [], totalScoreValue = 0) {
  const totalQuestions = items.reduce((total, item) => total + (Number(item.questionCount) || 0), 0);
  const totalScore = Number(totalScoreValue) || 0;
  const scorePerQuestion = totalQuestions > 0 ? totalScore / totalQuestions : 0;
  const difficultySummary = questionBankEnums.difficultyOptions.map((option) => {
    const questionCount = items
      .filter((item) => item.difficulty === option.value)
      .reduce((total, item) => total + (Number(item.questionCount) || 0), 0);

    return {
      difficulty: option.value,
      label: option.label,
      questionCount,
      totalScore: questionCount * scorePerQuestion,
    };
  });

  return {
    totalQuestions,
    totalScore,
    scorePerQuestion,
    difficultySummary,
  };
}

export function formatMatrixNumber(value, maximumFractionDigits = 2) {
  const numericValue = Number(value) || 0;

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(numericValue);
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

export function getBankQuestionValidationError(formValues = {}) {
  const content = String(formValues.content ?? "").trim();
  const score = Number(formValues.defaultScore);
  const answers = Array.isArray(formValues.answers) ? formValues.answers : [];
  const filledAnswers = answers.filter((answer) => String(answer.content ?? "").trim().length > 0);
  const correctAnswers = filledAnswers.filter((answer) => Boolean(answer.isCorrect));

  if (!content) {
    return "Vui lòng nhập nội dung câu hỏi.";
  }

  if (!Number.isFinite(score) || score <= 0) {
    return "Điểm mặc định phải lớn hơn 0.";
  }

  if (formValues.status !== "Approved") {
    return "";
  }

  if (formValues.questionType === "SingleChoice" && correctAnswers.length !== 1) {
    return "Câu hỏi một đáp án cần có đúng 1 đáp án đúng trước khi chuyển sang Sẵn sàng.";
  }

  if (formValues.questionType === "MultipleChoice" && correctAnswers.length < 1) {
    return "Câu hỏi nhiều đáp án cần có ít nhất 1 đáp án đúng trước khi chuyển sang Sẵn sàng.";
  }

  if (formValues.questionType === "TrueFalse" && correctAnswers.length !== 1) {
    return "Câu hỏi Đúng/Sai cần có đúng 1 lựa chọn đúng trước khi chuyển sang Sẵn sàng.";
  }

  if (formValues.questionType === "ShortAnswer" && filledAnswers.length < 1) {
    return "Câu trả lời ngắn cần có ít nhất 1 đáp án mẫu trước khi chuyển sang Sẵn sàng.";
  }

  return "";
}

export function getDifficultyBadgeVariant(value) {
  if (value === "Easy") {
    return "success";
  }

  if (value === "Hard") {
    return "danger";
  }

  return "caution";
}

export function getDifficultyBadgeMark(value) {
  if (value === "Easy") {
    return "+";
  }

  if (value === "Hard") {
    return "!";
  }

  return "~";
}

export function getStatusBadgeMark(value) {
  if (value === "Approved") {
    return "✓";
  }

  if (value === "Reviewed") {
    return "+";
  }

  if (value === "Archived") {
    return "-";
  }

  return "!";
}

export function getQuestionTypeLabel(value) {
  if (!value) {
    return "Bất kỳ";
  }

  return QUESTION_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function formatMatrixIssueRequirement(issue = {}) {
  const filters = [
    issue.subject ? `Môn: ${issue.subject}` : null,
    issue.chapter ? `Chương: ${issue.chapter}` : null,
    issue.lesson ? `Bài: ${issue.lesson}` : null,
    issue.learningOutcome ? `Yêu cầu cần đạt: ${issue.learningOutcome}` : null,
    issue.questionType ? `Loại: ${getQuestionTypeLabel(issue.questionType)}` : null,
    issue.difficulty ? `Độ khó: ${getDifficultyLabel(issue.difficulty)}` : null,
  ].filter(Boolean);

  return filters.length > 0 ? filters.join(" · ") : "Không giới hạn điều kiện lọc";
}

export function formatMatrixIssueShortfall(issue = {}) {
  const required = Number(issue.required) || 0;
  const available = Number(issue.available) || 0;
  const missing = Math.max(required - available, 0);

  return {
    required,
    available,
    missing,
  };
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
