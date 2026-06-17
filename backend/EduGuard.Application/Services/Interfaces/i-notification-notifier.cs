using EduGuard.Application.DTOs.Notifications;

namespace EduGuard.Application.Services.Interfaces;

public interface INotificationNotifier
{
    Task SendToUserAsync(string userId, RealtimeNotificationDto notification, CancellationToken ct = default);
    Task SendToRoleAsync(string role, RealtimeNotificationDto notification, CancellationToken ct = default);
    Task SendToAllAsync(RealtimeNotificationDto notification, CancellationToken ct = default);
}
