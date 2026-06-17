using EduGuard.Application.DTOs.AntiCheat;

namespace EduGuard.Application.Services.Interfaces;

public interface IExamMonitoringNotifier
{
    Task SendAntiCheatWarningAsync(AntiCheatWarningDto warning, CancellationToken ct = default);
}
