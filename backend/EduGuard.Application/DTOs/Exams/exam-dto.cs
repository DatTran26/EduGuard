namespace EduGuard.Application.DTOs.Exams;

public class ExamDto
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
    public DateTime CreatedAt { get; set; }
    public int QuestionCount { get; set; }
    public int AttemptCount { get; set; }
    public ExamSettingDto Settings { get; set; } = new();
}
