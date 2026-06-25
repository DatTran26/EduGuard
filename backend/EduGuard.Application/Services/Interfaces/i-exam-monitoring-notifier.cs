using EduGuard.Application.DTOs.AntiCheat;
using EduGuard.Application.DTOs.Proctoring;

namespace EduGuard.Application.Services.Interfaces;

public interface IExamMonitoringNotifier
{
    Task SendAntiCheatWarningAsync(AntiCheatWarningDto warning, CancellationToken ct = default);
    Task SendProctoringWarningAsync(ProctoringWarningDto warning, CancellationToken ct = default);
}
