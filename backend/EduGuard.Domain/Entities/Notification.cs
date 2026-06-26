using System;
using System.Collections.Generic;

namespace EduGuard.Domain.Entities;

public class Notification
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public int ClassroomId { get; set; }
    public int? RelatedExamId { get; set; }
    public int? RelatedExamAttemptId { get; set; }
    public string? ActionUrl { get; set; }
    public string? SourceKey { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ApplicationUser Sender { get; set; } = null!;
    public Classroom Classroom { get; set; } = null!;
    public ICollection<UserNotification> UserNotifications { get; set; } = [];
}
