namespace EduGuard.Domain.Entities;

public class ProctoringEvidence
{
    public int Id { get; set; }
    public int ExamAttemptId { get; set; }
    public int? CheatingLogId { get; set; }
    public string EvidenceType { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string CaptureSource { get; set; } = string.Empty;
    public string? TriggerEventType { get; set; }
    public string? TriggeredByUserId { get; set; }
    public decimal? Confidence { get; set; }
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
    public string? Metadata { get; set; }

    public ExamAttempt ExamAttempt { get; set; } = null!;
    public CheatingLog? CheatingLog { get; set; }
}
