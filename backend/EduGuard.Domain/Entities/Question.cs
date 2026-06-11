using EduGuard.Domain.Enums;

namespace EduGuard.Domain.Entities;

public class Question
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public decimal Score { get; set; }
    public int OrderIndex { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Exam Exam { get; set; } = null!;
    public ICollection<Answer> Answers { get; set; } = [];
}
