using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.DTOs.QuestionBanks;
using EduGuard.Domain.Entities;

namespace EduGuard.Infrastructure.QuestionBanks;

public static class QuestionBankMapper
{
    public static QuestionBankDto MapBank(QuestionBank bank) => new()
    {
        Id = bank.Id,
        TeacherId = bank.TeacherId,
        Name = bank.Name,
        Description = bank.Description,
        Subject = bank.Subject,
        GradeLevel = bank.GradeLevel,
        QuestionCount = bank.Questions?.Count ?? 0,
        CreatedAt = bank.CreatedAt,
        UpdatedAt = bank.UpdatedAt
    };

    public static BankQuestionDto MapQuestion(BankQuestion question) => new()
    {
        Id = question.Id,
        QuestionBankId = question.QuestionBankId,
        TeacherId = question.TeacherId,
        Content = question.Content,
        QuestionType = question.QuestionType,
        Difficulty = question.Difficulty,
        DefaultScore = question.DefaultScore,
        Subject = question.Subject,
        Chapter = question.Chapter,
        Lesson = question.Lesson,
        LearningOutcome = question.LearningOutcome,
        Status = question.Status,
        Version = question.Version,
        ParentQuestionId = question.ParentQuestionId,
        TimesUsed = question.TimesUsed,
        CreatedAt = question.CreatedAt,
        UpdatedAt = question.UpdatedAt,
        Answers = question.Answers
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.Id)
            .Select(MapAnswer)
            .ToList()
    };

    private static AnswerDto MapAnswer(BankAnswer answer) => new()
    {
        Id = answer.Id,
        Content = answer.Content,
        IsCorrect = answer.IsCorrect,
        OrderIndex = answer.OrderIndex
    };
}
