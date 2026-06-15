using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;

namespace EduGuard.Infrastructure.Exams;

public static class ExamGradingHelper
{
    public static decimal GradeQuestion(Question question, IReadOnlyList<StudentAnswer> studentAnswers)
    {
        if (studentAnswers.Count == 0)
            return 0;

        return question.QuestionType switch
        {
            QuestionType.ShortAnswer => GradeShortAnswer(question, studentAnswers),
            QuestionType.MultipleChoice => GradeMultipleChoice(question, studentAnswers) ? question.Score : 0,
            _ => GradeSingleSelection(question, studentAnswers) ? question.Score : 0
        };
    }

    public static decimal GradeExam(Exam exam, IReadOnlyList<StudentAnswer> studentAnswers)
    {
        return exam.Questions.Sum(question =>
        {
            var answersForQuestion = studentAnswers.Where(x => x.QuestionId == question.Id).ToList();
            return GradeQuestion(question, answersForQuestion);
        });
    }

    private static bool GradeSingleSelection(Question question, IReadOnlyList<StudentAnswer> studentAnswers)
    {
        var selectedIds = studentAnswers
            .Where(x => x.AnswerId.HasValue)
            .Select(x => x.AnswerId!.Value)
            .Distinct()
            .ToList();

        if (selectedIds.Count != 1)
            return false;

        var correctId = question.Answers.FirstOrDefault(x => x.IsCorrect)?.Id;
        return correctId.HasValue && selectedIds[0] == correctId.Value;
    }

    private static bool GradeMultipleChoice(Question question, IReadOnlyList<StudentAnswer> studentAnswers)
    {
        var selectedIds = studentAnswers
            .Where(x => x.AnswerId.HasValue)
            .Select(x => x.AnswerId!.Value)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        var correctIds = question.Answers
            .Where(x => x.IsCorrect)
            .Select(x => x.Id)
            .OrderBy(x => x)
            .ToList();

        return selectedIds.SequenceEqual(correctIds);
    }

    private static decimal GradeShortAnswer(Question question, IReadOnlyList<StudentAnswer> studentAnswers)
    {
        var text = studentAnswers
            .Select(x => x.TextAnswer?.Trim())
            .FirstOrDefault(x => !string.IsNullOrWhiteSpace(x));

        if (string.IsNullOrWhiteSpace(text))
            return 0;

        var accepted = question.Answers
            .Select(x => x.Content.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList();

        return accepted.Any(x => string.Equals(x, text, StringComparison.OrdinalIgnoreCase))
            ? question.Score
            : 0;
    }
}
