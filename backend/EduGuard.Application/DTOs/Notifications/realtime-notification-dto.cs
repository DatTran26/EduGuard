namespace EduGuard.Application.DTOs.Notifications;

public class RealtimeNotificationDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Tone { get; set; } = "info";
    public string? Url { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
