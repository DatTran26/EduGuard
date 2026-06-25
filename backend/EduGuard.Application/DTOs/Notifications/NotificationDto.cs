using System;

namespace EduGuard.Application.DTOs.Notifications;

public class NotificationDto
{
    public int UserNotificationId { get; set; }
    public int NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string ClassroomName { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
