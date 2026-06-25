using System.Security.Claims;
using EduGuard.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EduGuard.Api.Hubs;

[Authorize(Roles = "Teacher,Student,Admin")]
public class ExamMonitoringHub : Hub
{
    private readonly IExamMonitoringService _examMonitoringService;
    private readonly IProctoringSignalingService _proctoringSignalingService;
    private readonly ILiveProctoringService _liveProctoringService;

    public ExamMonitoringHub(
        IExamMonitoringService examMonitoringService,
        IProctoringSignalingService proctoringSignalingService,
        ILiveProctoringService liveProctoringService)
    {
        _examMonitoringService = examMonitoringService;
        _proctoringSignalingService = proctoringSignalingService;
        _liveProctoringService = liveProctoringService;
    }

    public static string GetExamGroupName(int examId) => $"exam:{examId}";
    public static string GetAttemptGroupName(int attemptId) => $"attempt:{attemptId}";

    public async Task JoinExam(int examId)
    {
        var user = GetCurrentUser();
        if (!user.roles.Contains("Teacher") && !user.roles.Contains("Admin"))
            throw new HubException("Chỉ giáo viên mới được join group giám sát đề thi.");

        await _examMonitoringService.EnsureCanMonitorExamAsync(
            examId,
            user.userId,
            user.roles,
            Context.ConnectionAborted);

        await Groups.AddToGroupAsync(Context.ConnectionId, GetExamGroupName(examId), Context.ConnectionAborted);
    }

    public Task LeaveExam(int examId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GetExamGroupName(examId), Context.ConnectionAborted);

    public async Task StudentJoinAttemptStream(int attemptId)
    {
        var user = GetCurrentUser();
        if (!user.roles.Contains("Student"))
            throw new HubException("Chỉ học sinh mới được publish camera stream.");

        await _proctoringSignalingService.EnsureStudentCanJoinAttemptStreamAsync(
            attemptId,
            user.userId,
            Context.ConnectionAborted);

        await Groups.AddToGroupAsync(Context.ConnectionId, GetAttemptGroupName(attemptId), Context.ConnectionAborted);
    }

    public async Task TeacherRequestWatch(int attemptId, bool enableAudio = false)
    {
        var user = GetCurrentUser();
        if (!user.roles.Contains("Teacher") && !user.roles.Contains("Admin"))
            throw new HubException("Chỉ giáo viên mới được request watch.");

        await _liveProctoringService.RequestWatchAsync(attemptId, user.userId, user.roles, Context.ConnectionAborted);
        await Groups.AddToGroupAsync(Context.ConnectionId, GetAttemptGroupName(attemptId), Context.ConnectionAborted);

        await Clients.Group(GetAttemptGroupName(attemptId)).SendAsync(
            "TeacherRequestedWatch",
            new { attemptId, teacherId = user.userId, enableAudio },
            Context.ConnectionAborted);
    }

    public async Task TeacherStopWatch(int attemptId)
    {
        var user = GetCurrentUser();
        if (!user.roles.Contains("Teacher") && !user.roles.Contains("Admin"))
            throw new HubException("Chỉ giáo viên mới được dừng watch.");

        await _liveProctoringService.StopWatchAsync(attemptId, user.userId, user.roles, Context.ConnectionAborted);
        await Clients.Group(GetAttemptGroupName(attemptId)).SendAsync(
            "TeacherStoppedWatch",
            new { attemptId, teacherId = user.userId },
            Context.ConnectionAborted);
    }

    public async Task SendOffer(int attemptId, object sdp)
    {
        await EnsureAttemptGroupMemberAsync(attemptId);
        await Clients.OthersInGroup(GetAttemptGroupName(attemptId)).SendAsync(
            "ReceiveWebRtcOffer",
            new { attemptId, sdp, senderId = GetCurrentUser().userId },
            Context.ConnectionAborted);
    }

    public async Task SendAnswer(int attemptId, object sdp)
    {
        await EnsureAttemptGroupMemberAsync(attemptId);
        await Clients.OthersInGroup(GetAttemptGroupName(attemptId)).SendAsync(
            "ReceiveWebRtcAnswer",
            new { attemptId, sdp, senderId = GetCurrentUser().userId },
            Context.ConnectionAborted);
    }

    public async Task SendIceCandidate(int attemptId, object candidate)
    {
        await EnsureAttemptGroupMemberAsync(attemptId);
        await Clients.OthersInGroup(GetAttemptGroupName(attemptId)).SendAsync(
            "ReceiveIceCandidate",
            new { attemptId, candidate, senderId = GetCurrentUser().userId },
            Context.ConnectionAborted);
    }

    private async Task EnsureAttemptGroupMemberAsync(int attemptId)
    {
        var user = GetCurrentUser();
        if (user.roles.Contains("Student"))
        {
            await _proctoringSignalingService.EnsureStudentCanJoinAttemptStreamAsync(
                attemptId,
                user.userId,
                Context.ConnectionAborted);
            return;
        }

        await _proctoringSignalingService.EnsureTeacherCanWatchAttemptAsync(
            attemptId,
            user.userId,
            user.roles,
            Context.ConnectionAborted);
    }

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
