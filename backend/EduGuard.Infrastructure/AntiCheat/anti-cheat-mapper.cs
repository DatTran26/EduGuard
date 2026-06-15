using EduGuard.Application.DTOs.AntiCheat;
using EduGuard.Domain.Entities;

namespace EduGuard.Infrastructure.AntiCheat;

public static class AntiCheatMapper
{
    public static CheatingLogDto MapLog(CheatingLog log) => new()
    {
        Id = log.Id,
        ExamAttemptId = log.ExamAttemptId,
        Type = CheatingTypeHelper.ToApiType(log.Type),
        Description = log.Description,
        SuspicionPoint = log.SuspicionPoint,
        Metadata = log.Metadata,
        OccurredAt = log.OccurredAt
    };
}
