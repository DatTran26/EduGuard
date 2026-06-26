namespace EduGuard.Application.DTOs.Proctoring;

public class LateJoinEventDto
{
    public int ExamId { get; set; }
    public int AttemptId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? ExamStartTime { get; set; }
    public int LateByMinutes { get; set; }
}
