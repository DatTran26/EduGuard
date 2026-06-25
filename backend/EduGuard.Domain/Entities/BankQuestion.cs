using EduGuard.Domain.Enums;

namespace EduGuard.Domain.Entities;

public class BankQuestion
{
    public int Id { get; set; }
    public int QuestionBankId { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Medium;
    public decimal DefaultScore { get; set; }
    public string? Subject { get; set; }
    public string? Chapter { get; set; }
    public string? Lesson { get; set; }
    public string? LearningOutcome { get; set; }
    public QuestionStatus Status { get; set; } = QuestionStatus.Approved;
    public int Version { get; set; } = 1;
    public int? ParentQuestionId { get; set; }
    public int TimesUsed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public QuestionBank QuestionBank { get; set; } = null!;
    public ApplicationUser Teacher { get; set; } = null!;
    public BankQuestion? ParentQuestion { get; set; }
    public ICollection<BankQuestion> Versions { get; set; } = [];
    public ICollection<BankAnswer> Answers { get; set; } = [];
    public ICollection<Question> ExamQuestionSnapshots { get; set; } = [];
}
