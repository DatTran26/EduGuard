using EduGuard.Domain.Enums;

namespace EduGuard.Domain.Entities;

public class CheatingLog
{
    public int Id { get; set; }
    public int ExamAttemptId { get; set; }
    public CheatingType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public int SuspicionPoint { get; set; }
    public string? Metadata { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    public ExamAttempt ExamAttempt { get; set; } = null!;
}
