namespace EduGuard.Application.Services.Interfaces;

public interface IExamMonitoringService
{
    Task EnsureCanMonitorExamAsync(
        int examId,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default);
}
