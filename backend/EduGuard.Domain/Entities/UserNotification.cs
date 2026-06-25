using System;

namespace EduGuard.Domain.Entities;

public class UserNotification
{
    public int Id { get; set; }
    public int NotificationId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Notification Notification { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
