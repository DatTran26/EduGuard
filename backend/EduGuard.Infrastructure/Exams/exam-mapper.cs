using EduGuard.Application.DTOs.Exams;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;

namespace EduGuard.Infrastructure.Exams;

public static class ExamMapper
{
    public static ExamDto MapExam(Exam exam, ExamSetting? setting = null, ExamAttempt? studentAttempt = null)
    {
        setting ??= exam.Setting;
        var dto = new ExamDto
        {
            Id = exam.Id,
            ClassroomId = exam.ClassroomId,
            TeacherId = exam.TeacherId,
            Title = exam.Title,
            Description = exam.Description,
            DurationMinutes = exam.DurationMinutes,
            StartTime = ExamDateTimeHelper.MarkNullableAsUtc(exam.StartTime),
            EndTime = ExamDateTimeHelper.MarkNullableAsUtc(exam.EndTime),
            IsPublished = exam.IsPublished,
            EnableAntiCheat = exam.EnableAntiCheat,
            CreatedAt = ExamDateTimeHelper.MarkAsUtc(exam.CreatedAt),
            QuestionCount = exam.Questions?.Count ?? 0,
            AttemptCount = exam.Attempts?.Count ?? 0,
            Settings = MapSetting(setting)
        };

        if (studentAttempt is not null)
        {
            dto.MyAttemptId = studentAttempt.Id;
            dto.MyAttemptStatus = studentAttempt.Status;
            dto.MyLatestScore = studentAttempt.Status == ExamAttemptStatus.Submitted
                ? studentAttempt.Score
                : null;
        }

        return dto;
    }

    public static ExamSettingDto MapSetting(ExamSetting? setting) => ExamSettingMapper.MapDto(setting);

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
