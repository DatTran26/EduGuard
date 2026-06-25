using EduGuard.Application.DTOs.Exams;
using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.QuestionBanks;

public class CreateBankQuestionRequest
{
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Medium;
    public decimal DefaultScore { get; set; }
    public string? Subject { get; set; }
    public string? Chapter { get; set; }
    public string? Lesson { get; set; }
    public string? LearningOutcome { get; set; }
    public QuestionStatus Status { get; set; } = QuestionStatus.Approved;
    public List<AnswerInputDto> Answers { get; set; } = [];
}
