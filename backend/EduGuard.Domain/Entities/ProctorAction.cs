namespace EduGuard.Domain.Entities;

public class ProctorAction
{
    public int Id { get; set; }
    public int ExamAttemptId { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Metadata { get; set; }

    public ExamAttempt ExamAttempt { get; set; } = null!;
}
