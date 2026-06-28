using EduGuard.Domain.Enums;

namespace EduGuard.Domain.Entities;

public class ExamMatrixItem
{
    public int Id { get; set; }
    public int ExamMatrixId { get; set; }
    public string? Chapter { get; set; }
    public string? Lesson { get; set; }
    public string? LearningOutcome { get; set; }
    public QuestionType? QuestionType { get; set; }
    public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Medium;
    public int QuestionCount { get; set; }
    public decimal ScorePerQuestion { get; set; }

    public ExamMatrix ExamMatrix { get; set; } = null!;
}
