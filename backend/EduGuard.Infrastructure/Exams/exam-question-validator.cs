using EduGuard.Application.DTOs.Exams;
using EduGuard.Domain.Enums;

namespace EduGuard.Infrastructure.Exams;

public static class ExamQuestionValidator
{
    public static void ValidateQuestionInput(
        QuestionType questionType,
        IReadOnlyList<AnswerInputDto> answers)
    {
        var normalized = NormalizeAnswers(questionType, answers);
        var correctCount = normalized.Count(x => x.IsCorrect);

        switch (questionType)
        {
            case QuestionType.ShortAnswer when normalized.Count == 0:
                throw new InvalidOperationException("Câu tự luận ngắn cần ít nhất 1 đáp án mẫu.");
            case QuestionType.SingleChoice when normalized.Count < 2:
                throw new InvalidOperationException("Câu một đáp án cần ít nhất 2 lựa chọn.");
            case QuestionType.SingleChoice when correctCount != 1:
                throw new InvalidOperationException("Câu một đáp án phải có đúng 1 đáp án đúng.");
            case QuestionType.MultipleChoice when normalized.Count < 2:
                throw new InvalidOperationException("Câu nhiều đáp án cần ít nhất 2 lựa chọn.");
            case QuestionType.MultipleChoice when correctCount == 0:
                throw new InvalidOperationException("Câu nhiều đáp án cần ít nhất 1 đáp án đúng.");
            case QuestionType.TrueFalse when correctCount != 1:
                throw new InvalidOperationException("Câu đúng/sai phải có đúng 1 đáp án đúng.");
        }
    }

    public static List<AnswerInputDto> NormalizeAnswers(
        QuestionType questionType,
        IReadOnlyList<AnswerInputDto> answers)
    {
        if (questionType == QuestionType.TrueFalse)
        {
            var trueAnswer = answers.ElementAtOrDefault(0);
            var falseAnswer = answers.ElementAtOrDefault(1);
            var correctIndex = answers.ToList().FindIndex(x => x.IsCorrect);

            return
            [
                new AnswerInputDto
                {
                    Id = trueAnswer?.Id,
                    Content = "Đúng",
                    IsCorrect = correctIndex is -1 or 0,
                    OrderIndex = 1
                },
                new AnswerInputDto
                {
                    Id = falseAnswer?.Id,
                    Content = "Sai",
                    IsCorrect = correctIndex == 1,
                    OrderIndex = 2
                }
            ];
        }

        if (questionType == QuestionType.ShortAnswer)
        {
            return answers
                .Select((answer, index) => new AnswerInputDto
                {
                    Id = answer.Id,
                    Content = answer.Content.Trim(),
                    IsCorrect = true,
                    OrderIndex = index + 1
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.Content))
                .ToList();
        }

        return answers
            .Select((answer, index) => new AnswerInputDto
            {
                Id = answer.Id,
                Content = answer.Content.Trim(),
                IsCorrect = answer.IsCorrect,
                OrderIndex = answer.OrderIndex > 0 ? answer.OrderIndex : index + 1
            })
            .Where(x => !string.IsNullOrWhiteSpace(x.Content))
            .ToList();
    }
}
