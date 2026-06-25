namespace EduGuard.Application.DTOs.Proctoring;

public class ProctoringWarningDto
{
    public int ExamId { get; set; }
    public int AttemptId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
