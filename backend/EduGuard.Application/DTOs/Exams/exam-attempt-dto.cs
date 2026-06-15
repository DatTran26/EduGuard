using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.Exams;

public class ExamAttemptDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public decimal? Score { get; set; }
    public int SuspicionScore { get; set; }
    public ExamAttemptStatus Status { get; set; }
}
