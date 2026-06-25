namespace EduGuard.Domain.Entities;

public class LiveProctoringSession
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int ExamAttemptId { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Status { get; set; } = "Requested";
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConnectedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string? EndReason { get; set; }
    public string? Metadata { get; set; }

    public Exam Exam { get; set; } = null!;
    public ExamAttempt ExamAttempt { get; set; } = null!;
}
