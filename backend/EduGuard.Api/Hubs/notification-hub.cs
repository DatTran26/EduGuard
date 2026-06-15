using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EduGuard.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public static string GetUserGroupName(string userId) => $"user:{userId}";

    public static string GetRoleGroupName(string role) => $"role:{role}";

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, GetUserGroupName(userId), Context.ConnectionAborted);

        var roles = Context.User?.FindAll(ClaimTypes.Role).Select(claim => claim.Value) ?? [];
        foreach (var role in roles)
            await Groups.AddToGroupAsync(Context.ConnectionId, GetRoleGroupName(role), Context.ConnectionAborted);

        await base.OnConnectedAsync();
    }
}
