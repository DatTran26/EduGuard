using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.ExamMatrices;

public class ExamMatrixItemDto
{
    public int Id { get; set; }
    public int ExamMatrixId { get; set; }
    public string? Chapter { get; set; }
    public string? Lesson { get; set; }
    public string? LearningOutcome { get; set; }
    public QuestionType? QuestionType { get; set; }
    public DifficultyLevel Difficulty { get; set; }
    public int QuestionCount { get; set; }
    public decimal ScorePerQuestion { get; set; }
}
