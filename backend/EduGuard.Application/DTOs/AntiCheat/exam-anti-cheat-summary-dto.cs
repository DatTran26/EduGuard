namespace EduGuard.Application.DTOs.AntiCheat;

public class ExamAntiCheatSummaryDto
{
    public int ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public int TotalAttempts { get; set; }
    public int FlaggedAttempts { get; set; }
    public int TotalLogs { get; set; }
    public IReadOnlyList<AttemptSuspicionSummaryDto> Attempts { get; set; } = [];
}

public class AttemptSuspicionSummaryDto
{
    public int AttemptId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int SuspicionScore { get; set; }
    public int LogCount { get; set; }
    public string Status { get; set; } = string.Empty;
}
