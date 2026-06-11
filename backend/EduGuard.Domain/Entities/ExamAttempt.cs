using EduGuard.Domain.Enums;

namespace EduGuard.Domain.Entities;

public class ExamAttempt
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int StudentId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public decimal? Score { get; set; }
    public int SuspicionScore { get; set; }
    public ExamAttemptStatus Status { get; set; } = ExamAttemptStatus.InProgress;

    public Exam Exam { get; set; } = null!;
    public ApplicationUser Student { get; set; } = null!;
    public ICollection<StudentAnswer> StudentAnswers { get; set; } = [];
    public ICollection<CheatingLog> CheatingLogs { get; set; } = [];
}
