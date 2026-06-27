using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.QuestionBanks;

public class GenerateBankQuestionsAiRequest
{
    public string Prompt { get; set; } = string.Empty;
    public string? UserApiKey { get; set; }
    public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Medium;
    public QuestionStatus Status { get; set; } = QuestionStatus.Approved;
    public string? Subject { get; set; }
    public string? Chapter { get; set; }
    public string? Lesson { get; set; }
    public string? LearningOutcome { get; set; }
}
