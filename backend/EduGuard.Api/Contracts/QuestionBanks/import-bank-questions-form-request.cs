using EduGuard.Application.DTOs.QuestionBanks;
using EduGuard.Domain.Enums;

namespace EduGuard.Api.Contracts.QuestionBanks;

public sealed class ImportBankQuestionsFormRequest
{
    public IFormFile? File { get; set; }
    public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Medium;
    public QuestionStatus Status { get; set; } = QuestionStatus.Approved;
    public string? Subject { get; set; }
    public string? Chapter { get; set; }
    public string? Lesson { get; set; }
    public string? LearningOutcome { get; set; }

    public ImportBankQuestionsRequest ToRequest() => new()
    {
        Difficulty = Difficulty,
        Status = Status,
        Subject = Subject,
        Chapter = Chapter,
        Lesson = Lesson,
        LearningOutcome = LearningOutcome
    };
}
