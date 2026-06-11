namespace EduGuard.Application.DTOs.AntiCheat;

public class CreateCheatingLogRequest
{
    public int ExamAttemptId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Metadata { get; set; }
}
