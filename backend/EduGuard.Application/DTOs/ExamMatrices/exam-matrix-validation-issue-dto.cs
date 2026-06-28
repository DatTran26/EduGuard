using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.ExamMatrices;

public class ExamMatrixValidationIssueDto
{
    public int? MatrixItemId { get; set; }
    public string? Subject { get; set; }
    public string? Chapter { get; set; }
    public string? Lesson { get; set; }
    public string? LearningOutcome { get; set; }
    public QuestionType? QuestionType { get; set; }
    public DifficultyLevel? Difficulty { get; set; }
    public int Required { get; set; }
    public int Available { get; set; }
    public string Message { get; set; } = string.Empty;
}
