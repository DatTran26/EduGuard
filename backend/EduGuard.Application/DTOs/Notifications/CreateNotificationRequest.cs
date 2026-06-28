using System.Collections.Generic;

namespace EduGuard.Application.DTOs.Notifications;

public class CreateNotificationRequest
{
    public int ClassroomId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<string>? RecipientIds { get; set; }
}
