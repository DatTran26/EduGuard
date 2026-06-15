using System.Security.Claims;
using EduGuard.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EduGuard.Api.Hubs;

[Authorize(Roles = "Teacher")]
public class ExamMonitoringHub : Hub
{
    private readonly IExamMonitoringService _examMonitoringService;

    public ExamMonitoringHub(IExamMonitoringService examMonitoringService) =>
        _examMonitoringService = examMonitoringService;

    public static string GetExamGroupName(int examId) => $"exam:{examId}";

    public async Task JoinExam(int examId)
    {
        var user = GetCurrentUser();
        await _examMonitoringService.EnsureCanMonitorExamAsync(
            examId,
            user.userId,
            user.roles,
            Context.ConnectionAborted);

        await Groups.AddToGroupAsync(Context.ConnectionId, GetExamGroupName(examId), Context.ConnectionAborted);
    }

    public Task LeaveExam(int examId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GetExamGroupName(examId), Context.ConnectionAborted);

    private (string userId, List<string> roles) GetCurrentUser()
    {
        var principal = Context.User ?? throw new HubException("Token không hợp lệ.");
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            throw new HubException("Token không hợp lệ.");

        var roles = principal.FindAll(ClaimTypes.Role).Select(claim => claim.Value).ToList();
        return (userId, roles);
    }
}
