using EduGuard.Application.DTOs.Exams;
using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.QuestionBanks;

public class BankQuestionDto
{
    public int Id { get; set; }
    public int QuestionBankId { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public DifficultyLevel Difficulty { get; set; }
    public decimal DefaultScore { get; set; }
    public string? Subject { get; set; }
    public string? Chapter { get; set; }
    public string? Lesson { get; set; }
    public string? LearningOutcome { get; set; }
    public QuestionStatus Status { get; set; }
    public int Version { get; set; }
    public int? ParentQuestionId { get; set; }
    public int TimesUsed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<AnswerDto> Answers { get; set; } = [];
}
