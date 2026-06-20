function createDraftId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveDraftEntityId(value, prefix) {
  if (typeof value === "number" && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return createDraftId(prefix);
}

function normalizeDraftAnswer(answer = {}, index = 0) {
  return {
    id: resolveDraftEntityId(answer.id, "draft-answer"),
    content: answer.content ?? "",
    isCorrect: Boolean(answer.isCorrect),
    orderIndex: Number(answer.orderIndex) > 0 ? Number(answer.orderIndex) : index + 1,
  };
}

export function buildDraftQuestion(question = {}, fallbackOrderIndex = 1) {
  const answers = Array.isArray(question.answers)
    ? question.answers
        .map((answer, index) => normalizeDraftAnswer(answer, index))
        .sort((firstAnswer, secondAnswer) => firstAnswer.orderIndex - secondAnswer.orderIndex)
    : [];

  return {
    id: resolveDraftEntityId(question.id, "draft-question"),
    examId: Number(question.examId) || 0,
    content: question.content ?? "",
    questionType: question.questionType ?? "SingleChoice",
    score: Number(question.score) || 0,
    orderIndex: Number(question.orderIndex) > 0 ? Number(question.orderIndex) : fallbackOrderIndex,
    answerCount: answers.length,
    correctAnswerCount: answers.filter((answer) => answer.isCorrect).length,
    answers,
  };
}

export function resequenceDraftQuestions(questions = []) {
  return [...questions]
    .map((question, index) => ({
      originalIndex: index,
      question: buildDraftQuestion(question, index + 1),
    }))
    .sort((firstItem, secondItem) => {
      const orderDifference = firstItem.question.orderIndex - secondItem.question.orderIndex;

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return firstItem.originalIndex - secondItem.originalIndex;
    })
    .map((item, index) => ({
      ...item.question,
      orderIndex: index + 1,
    }));
}
