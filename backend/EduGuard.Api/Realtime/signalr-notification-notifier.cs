using EduGuard.Api.Hubs;
using EduGuard.Application.DTOs.Notifications;
using EduGuard.Application.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace EduGuard.Api.Realtime;

public class SignalRNotificationNotifier : INotificationNotifier
{
    private const string NotificationEvent = "ReceiveNotification";

    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationNotifier(IHubContext<NotificationHub> hubContext) => _hubContext = hubContext;

    public Task SendToUserAsync(string userId, RealtimeNotificationDto notification, CancellationToken ct = default) =>
        _hubContext.Clients
            .Group(NotificationHub.GetUserGroupName(userId))
            .SendAsync(NotificationEvent, notification, ct);

    public Task SendToRoleAsync(string role, RealtimeNotificationDto notification, CancellationToken ct = default) =>
        _hubContext.Clients
            .Group(NotificationHub.GetRoleGroupName(role))
            .SendAsync(NotificationEvent, notification, ct);

    public Task SendToAllAsync(RealtimeNotificationDto notification, CancellationToken ct = default) =>
        _hubContext.Clients.All.SendAsync(NotificationEvent, notification, ct);
}
