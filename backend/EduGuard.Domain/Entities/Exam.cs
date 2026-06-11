namespace EduGuard.Domain.Entities;

public class Exam
{
    public int Id { get; set; }
    public int ClassroomId { get; set; }
    public int TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool IsPublished { get; set; }
    public bool EnableAntiCheat { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Classroom Classroom { get; set; } = null!;
    public ApplicationUser Teacher { get; set; } = null!;
    public ExamSetting? Setting { get; set; }
    public ICollection<Question> Questions { get; set; } = [];
    public ICollection<ExamAttempt> Attempts { get; set; } = [];
}
