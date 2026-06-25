using EduGuard.Application.DTOs.Notifications;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace EduGuard.Application.Services.Interfaces;

public interface INotificationService
{
    Task CreateClassroomNotificationAsync(string senderId, CreateNotificationRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<NotificationDto>> GetMyNotificationsAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<ClassroomNotificationDto>> GetClassroomNotificationsAsync(int classroomId, string userId, CancellationToken ct = default);
    Task<UnreadCountDto> GetUnreadCountAsync(string userId, CancellationToken ct = default);
    Task MarkAsReadAsync(string userId, int userNotificationId, CancellationToken ct = default);
    Task MarkAllAsReadAsync(string userId, CancellationToken ct = default);
}
