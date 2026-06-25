namespace EduGuard.Application.DTOs.Proctoring;

public class ProctoringControlEventDto
{
    public int ExamId { get; set; }
    public int AttemptId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
