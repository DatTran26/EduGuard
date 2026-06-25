using EduGuard.Application.DTOs.AntiCheat;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.AntiCheat;

namespace EduGuard.Infrastructure.Proctoring;

public static class ProctoringCheatingLogHelper
{
    public static async Task LogProctoringSignalAsync(
        IAntiCheatService antiCheatService,
        int attemptId,
        string studentId,
        CheatingType type,
        string description,
        string? metadata,
        CancellationToken ct)
    {
        await antiCheatService.LogAsync(new CreateCheatingLogRequest
        {
            ExamAttemptId = attemptId,
            Type = CheatingTypeHelper.ToApiType(type),
            Description = description,
            Metadata = metadata
        }, studentId, ct);
    }
}
