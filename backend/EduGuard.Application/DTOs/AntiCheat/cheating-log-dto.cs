namespace EduGuard.Application.DTOs.AntiCheat;

public class CheatingLogDto
{
    public int Id { get; set; }
    public int ExamAttemptId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SuspicionPoint { get; set; }
    public string? Metadata { get; set; }
    public DateTime OccurredAt { get; set; }
}
