namespace EduGuard.Domain.Entities;

public class ProctoringState
{
    public int Id { get; set; }
    public int ExamAttemptId { get; set; }
    public string CameraStatus { get; set; } = "Unknown";
    public string LiveStatus { get; set; } = "Inactive";
    public string FullscreenStatus { get; set; } = "Unknown";
    public string ConnectionStatus { get; set; } = "Unknown";
    public string EnvironmentStatus { get; set; } = "Normal";
    public string? LatestDetectionType { get; set; }
    public int WarningCount { get; set; }
    public int EvidenceCount { get; set; }
    public int SuspicionScore { get; set; }
    public string RiskLevel { get; set; } = "Normal";
    public DateTime LastHeartbeatAt { get; set; } = DateTime.UtcNow;
    public DateTime? LatestWarningAt { get; set; }

    public ExamAttempt ExamAttempt { get; set; } = null!;
}
