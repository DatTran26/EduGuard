using EduGuard.Application.DTOs.Exams;
using EduGuard.Domain.Entities;

namespace EduGuard.Infrastructure.Exams;

public static class ExamMapper
{
    public static ExamDto MapExam(Exam exam, ExamSetting? setting = null)
    {
        setting ??= exam.Setting;
        return new ExamDto
        {
            Id = exam.Id,
            ClassroomId = exam.ClassroomId,
            TeacherId = exam.TeacherId,
            Title = exam.Title,
            Description = exam.Description,
            DurationMinutes = exam.DurationMinutes,
            StartTime = exam.StartTime,
            EndTime = exam.EndTime,
            IsPublished = exam.IsPublished,
            EnableAntiCheat = exam.EnableAntiCheat,
            CreatedAt = exam.CreatedAt,
            QuestionCount = exam.Questions?.Count ?? 0,
            AttemptCount = exam.Attempts?.Count ?? 0,
            Settings = MapSetting(setting)
        };
    }

    public static ExamSettingDto MapSetting(ExamSetting? setting) => new()
    {
        ShuffleQuestions = setting?.ShuffleQuestions ?? false,
        ShuffleAnswers = setting?.ShuffleAnswers ?? false,
        MaxAttempts = setting?.MaxAttempts ?? 1,
        ShowResultAfterSubmit = setting?.ShowResultAfterSubmit ?? false,
        RequireFullscreen = setting?.RequireFullscreen ?? false
    };

    public static QuestionDto MapQuestion(Question question, bool hideCorrectAnswers = false) => new()
    {
        Id = question.Id,
        ExamId = question.ExamId,
        Content = question.Content,
        QuestionType = question.QuestionType,
        Score = question.Score,
        OrderIndex = question.OrderIndex,
        Answers = question.Answers
            .OrderBy(a => a.OrderIndex)
            .ThenBy(a => a.Id)
            .Select(a => MapAnswer(a, hideCorrectAnswers))
            .ToList()
    };

    public static AnswerDto MapAnswer(Answer answer, bool hideCorrectAnswers = false) => new()
    {
        Id = answer.Id,
        Content = answer.Content,
        IsCorrect = hideCorrectAnswers ? false : answer.IsCorrect,
        OrderIndex = answer.OrderIndex
    };

    public static ExamAttemptDto MapAttempt(ExamAttempt attempt) => new()
    {
        Id = attempt.Id,
        ExamId = attempt.ExamId,
        StudentId = attempt.StudentId,
        StudentName = attempt.Student?.FullName ?? string.Empty,
        StartedAt = attempt.StartedAt,
        SubmittedAt = attempt.SubmittedAt,
        Score = attempt.Score,
        SuspicionScore = attempt.SuspicionScore,
        Status = attempt.Status
    };

    public static List<StudentAnswerDto> MapSavedAnswers(IEnumerable<StudentAnswer> answers) =>
        answers
            .GroupBy(x => x.QuestionId)
            .Select(group =>
            {
                var textAnswer = group.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x.TextAnswer))?.TextAnswer;
                return new StudentAnswerDto
                {
                    QuestionId = group.Key,
                    AnswerIds = group.Where(x => x.AnswerId.HasValue).Select(x => x.AnswerId!.Value).ToList(),
                    TextAnswer = textAnswer
                };
            })
            .ToList();
}
