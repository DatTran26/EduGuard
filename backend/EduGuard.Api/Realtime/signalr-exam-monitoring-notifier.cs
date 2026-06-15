using EduGuard.Api.Hubs;
using EduGuard.Application.DTOs.AntiCheat;
using EduGuard.Application.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace EduGuard.Api.Realtime;

public class SignalRExamMonitoringNotifier : IExamMonitoringNotifier
{
    private const string AntiCheatWarningEvent = "ReceiveAntiCheatWarning";

    private readonly IHubContext<ExamMonitoringHub> _hubContext;

    public SignalRExamMonitoringNotifier(IHubContext<ExamMonitoringHub> hubContext) =>
        _hubContext = hubContext;

    public Task SendAntiCheatWarningAsync(AntiCheatWarningDto warning, CancellationToken ct = default) =>
        _hubContext.Clients
            .Group(ExamMonitoringHub.GetExamGroupName(warning.ExamId))
            .SendAsync(AntiCheatWarningEvent, warning, ct);
}
