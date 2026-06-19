/**
 * Builds a single answer object structure for form state.
 * @param {object} answer
 * @param {string} fallbackContent
 * @returns {object} Form answer state
 */
export function buildAnswerFormValue(answer = {}, fallbackContent = "") {
  return {
    id: answer.id ?? null,
    content: answer.content ?? fallbackContent,
    isCorrect: Boolean(answer.isCorrect),
  };
}

/**
 * Gets the minimum required answers for a given question type.
 * @param {string} questionType
 * @returns {number}
 */
export function getMinimumAnswerCount(questionType) {
  if (questionType === "ShortAnswer") {
    return 1;
  }

  if (questionType === "TrueFalse") {
    return 2;
  }

  return 2;
}

/**
 * Builds default answers structure based on the question type.
 * @param {string} questionType
 * @returns {array} Default answer options
 */
export function buildDefaultAnswerValues(questionType) {
  if (questionType === "TrueFalse") {
    return [
      buildAnswerFormValue({ content: "Đúng", isCorrect: true }),
      buildAnswerFormValue({ content: "Sai", isCorrect: false }),
    ];
  }

  if (questionType === "ShortAnswer") {
    return [buildAnswerFormValue()];
  }

  return [buildAnswerFormValue(), buildAnswerFormValue()];
}

/**
 * Builds the complete question form initial state.
 * @param {object|null} question
 * @param {number} defaultOrderIndex
 * @returns {object} Form state object
 */
export function buildQuestionFormValues(question = null, defaultOrderIndex = 1) {
  const questionType = question?.questionType ?? "SingleChoice";

  return {
    content: question?.content ?? "",
    orderIndex: question?.orderIndex ? String(question.orderIndex) : String(defaultOrderIndex),
    questionType,
    score: question?.score ? String(question.score) : "1",
    answers:
      question?.answers?.length > 0
        ? question.answers.map((answer) => buildAnswerFormValue(answer))
        : buildDefaultAnswerValues(questionType),
  };
}

export function getQuestionTypeGuidance(questionType) {
  switch (questionType) {
    case "SingleChoice":
      return {
        title: "Quy tắc câu một đáp án",
        description:
          "Cần ít nhất 2 lựa chọn và chỉ được đánh dấu đúng 1 đáp án. Đây cũng là điều kiện backend kiểm tra khi publish đề.",
      };

    case "MultipleChoice":
      return {
        title: "Quy tắc câu nhiều đáp án",
        description:
          "Cần ít nhất 2 lựa chọn và phải có tối thiểu 1 đáp án đúng. Bạn có thể tick nhiều đáp án đúng nếu muốn.",
      };

    case "TrueFalse":
      return {
        title: "Quy tắc câu Đúng / Sai",
        description:
          "Hệ thống cố định 2 lựa chọn Đúng và Sai. Bạn chỉ cần chọn đáp án đúng, không thêm hoặc xóa lựa chọn ở loại câu này.",
      };

    case "ShortAnswer":
      return {
        title: "Quy tắc câu tự luận ngắn",
        description:
          "Nhập một hoặc nhiều đáp án mẫu để hệ thống dùng khi chấm tự động. Có thể thêm nhiều cách diễn đạt nếu cần.",
      };

    default:
      return null;
  }
}

export function isTrueFalseQuestion(questionType) {
  return questionType === "TrueFalse";
}

export function allowsMultipleCorrectAnswers(questionType) {
  return questionType === "MultipleChoice";
}

export function isShortAnswerQuestion(questionType) {
  return questionType === "ShortAnswer";
}