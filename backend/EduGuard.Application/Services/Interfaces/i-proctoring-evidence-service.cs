using EduGuard.Application.DTOs.Proctoring;

namespace EduGuard.Application.Services.Interfaces;

public interface IProctoringEvidenceService
{
    Task<ProctoringEvidenceDto> SaveEvidenceAsync(
        int attemptId,
        string userId,
        IReadOnlyList<string> roles,
        Stream fileStream,
        string fileName,
        string contentType,
        string evidenceType,
        string captureSource,
        string? triggerEventType,
        string? metadata,
        CancellationToken ct = default);

    Task<ProctoringEvidenceFileResult> GetEvidenceFileAsync(
        int attemptId,
        int evidenceId,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default);
}

public sealed record ProctoringEvidenceFileResult(
    Stream Stream,
    string ContentType,
    string FileName);
