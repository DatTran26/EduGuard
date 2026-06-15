namespace EduGuard.Application.DTOs.AntiCheat;

public class AntiCheatWarningDto
{
    public int LogId { get; set; }
    public int ExamId { get; set; }
    public int ExamAttemptId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SuspicionPoint { get; set; }
    public int SuspicionScore { get; set; }
    public int LogCount { get; set; }
    public string? Metadata { get; set; }
    public DateTime OccurredAt { get; set; }
}
