using EduGuard.Application.DTOs.ExamMatrices;
using EduGuard.Domain.Entities;

namespace EduGuard.Infrastructure.ExamMatrices;

public static class ExamMatrixMapper
{
    public static ExamMatrixDto MapMatrix(ExamMatrix matrix) => new()
    {
        Id = matrix.Id,
        TeacherId = matrix.TeacherId,
        Name = matrix.Name,
        Subject = matrix.Subject,
        GradeLevel = matrix.GradeLevel,
        TotalQuestions = matrix.TotalQuestions,
        TotalScore = matrix.TotalScore,
        DurationMinutes = matrix.DurationMinutes,
        CreatedAt = matrix.CreatedAt,
        UpdatedAt = matrix.UpdatedAt,
        Items = matrix.Items
            .OrderBy(x => x.Id)
            .Select(MapItem)
            .ToList()
    };

    public static ExamMatrixItemDto MapItem(ExamMatrixItem item) => new()
    {
        Id = item.Id,
        ExamMatrixId = item.ExamMatrixId,
        Chapter = item.Chapter,
        Lesson = item.Lesson,
        LearningOutcome = item.LearningOutcome,
        QuestionType = item.QuestionType,
        Difficulty = item.Difficulty,
        QuestionCount = item.QuestionCount,
        ScorePerQuestion = item.ScorePerQuestion
    };
}
