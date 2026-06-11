namespace EduGuard.Domain.Entities;

public class StudentAnswer
{
    public int Id { get; set; }
    public int ExamAttemptId { get; set; }
    public int QuestionId { get; set; }
    public int? AnswerId { get; set; }
    public string? TextAnswer { get; set; }

    public ExamAttempt ExamAttempt { get; set; } = null!;
    public Question Question { get; set; } = null!;
    public Answer? Answer { get; set; }
}
