namespace EduGuard.Application.DTOs.Exams;

public class UpdateExamRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool EnableAntiCheat { get; set; }
    public ExamSettingDto Settings { get; set; } = new();
}
