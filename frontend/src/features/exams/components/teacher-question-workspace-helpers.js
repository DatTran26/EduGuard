export const QUESTION_WORKSPACE_FILTERS = [
  { value: "All", label: "Tất cả" },
  { value: "SingleChoice", label: "Một đáp án" },
  { value: "MultipleChoice", label: "Nhiều đáp án" },
  { value: "TrueFalse", label: "Đúng / Sai" },
  { value: "ShortAnswer", label: "Tự luận ngắn" },
];

export const QUESTION_WORKSPACE_SORT_OPTIONS = [
  { value: "OrderAsc", label: "Theo thứ tự" },
  { value: "ScoreDesc", label: "Điểm cao nhất" },
  { value: "QuestionType", label: "Theo loại câu hỏi" },
];

export const QUESTION_IMPORT_ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".txt", ".docx", ".pdf"];
export const QUESTION_IMPORT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function buildQuestionSummaryItems(exam = null, questions = []) {
  const singleChoiceCount = questions.filter((question) => question.questionType === "SingleChoice").length;
  const multipleChoiceCount = questions.filter((question) => question.questionType === "MultipleChoice").length;
  const trueFalseCount = questions.filter((question) => question.questionType === "TrueFalse").length;
  const shortAnswerCount = questions.filter((question) => question.questionType === "ShortAnswer").length;
  const totalQuestionScore = questions.reduce(
    (totalValue, question) => totalValue + Number(question.score || 0),
    0,
  );

  return [
    { label: "Tổng câu hỏi", value: questions.length || Number(exam?.questionCount) || 0 },
    { label: "Tổng điểm", value: totalQuestionScore },
    { label: "Một đáp án", value: singleChoiceCount },
    { label: "Nhiều đáp án", value: multipleChoiceCount },
    { label: "Đúng / Sai", value: trueFalseCount },
    { label: "Tự luận ngắn", value: shortAnswerCount },
  ];
}

export function filterQuestionItems(questions, filterValue) {
  if (filterValue === "All") {
    return questions;
  }

  return questions.filter((question) => question.questionType === filterValue);
}

export function sortQuestionItems(questions, sortValue) {
  const nextQuestions = [...questions];

  switch (sortValue) {
    case "ScoreDesc":
      return nextQuestions.sort((firstQuestion, secondQuestion) => {
        const scoreDifference = Number(secondQuestion.score || 0) - Number(firstQuestion.score || 0);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return Number(firstQuestion.orderIndex || 0) - Number(secondQuestion.orderIndex || 0);
      });

    case "QuestionType":
      return nextQuestions.sort((firstQuestion, secondQuestion) => {
        const typeComparison = String(firstQuestion.questionType).localeCompare(String(secondQuestion.questionType));

        if (typeComparison !== 0) {
          return typeComparison;
        }

        return Number(firstQuestion.orderIndex || 0) - Number(secondQuestion.orderIndex || 0);
      });

    default:
      return nextQuestions.sort(
        (firstQuestion, secondQuestion) =>
          Number(firstQuestion.orderIndex || 0) - Number(secondQuestion.orderIndex || 0),
      );
  }
}

function getQuestionImportExtension(fileName = "") {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) {
    return "";
  }

  return fileName.slice(dotIndex).toLowerCase();
}

export function validateQuestionImportFile(file) {
  if (!file) {
    return "Hãy chọn file import trước khi review.";
  }

  const extension = getQuestionImportExtension(file.name);

  if (!QUESTION_IMPORT_ACCEPTED_EXTENSIONS.includes(extension)) {
    return `Chỉ hỗ trợ ${QUESTION_IMPORT_ACCEPTED_EXTENSIONS.join(", ")}.`;
  }

  if (file.size > QUESTION_IMPORT_MAX_FILE_SIZE_BYTES) {
    return "File vượt quá giới hạn 5 MB của backend import.";
  }

  return "";
}

export function formatQuestionImportFieldName(fieldName = "") {
  if (!fieldName) {
    return "Chung";
  }

  return fieldName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (value) => value.toUpperCase());
}
