using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.ExamMatrices;

public class CreateExamMatrixItemRequest
{
    public string? Chapter { get; set; }
    public string? Lesson { get; set; }
    public string? LearningOutcome { get; set; }
    public QuestionType? QuestionType { get; set; }
    public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Medium;
    public int QuestionCount { get; set; }
    public decimal ScorePerQuestion { get; set; }
}
