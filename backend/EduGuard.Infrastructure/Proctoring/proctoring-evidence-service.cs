using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Application.Options;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduGuard.Infrastructure.Proctoring;

public class ProctoringEvidenceService : IProctoringEvidenceService
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/webm",
        "video/mp4"
    };

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _environment;
    private readonly IExamMonitoringService _examMonitoringService;
    private readonly IProctoringRepository _proctoringRepository;
    private readonly ProctoringOptions _options;

    public ProctoringEvidenceService(
        AppDbContext db,
        IWebHostEnvironment environment,
        IExamMonitoringService examMonitoringService,
        IProctoringRepository proctoringRepository,
        IOptions<ProctoringOptions> options)
    {
        _db = db;
        _environment = environment;
        _examMonitoringService = examMonitoringService;
        _proctoringRepository = proctoringRepository;
        _options = options.Value;
    }

    public async Task<ProctoringEvidenceDto> SaveEvidenceAsync(
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
        CancellationToken ct = default)
    {
        if (fileStream.CanSeek)
        {
            if (fileStream.Length <= 0)
                throw new ArgumentException("File bằng trống.");

            if (fileStream.Length > _options.MaxEvidenceFileBytes)
                throw new ArgumentException("File vượt quá dung lượng cho phép.");
        }

        if (!AllowedContentTypes.Contains(contentType))
            throw new ArgumentException("Định dạng file không được hỗ trợ.");

        var attempt = await _db.ExamAttempts
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        if (roles.Contains("Student"))
        {
            if (attempt.StudentId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền lưu bằng chứng cho lượt làm này.");
        }
        else
        {
            await _examMonitoringService.EnsureCanMonitorExamAsync(attempt.ExamId, userId, roles, ct);
        }

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase) ? ".webm" : ".jpg";
        }

        var storedFileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension}";
        var relativeUrl = $"/uploads/proctoring/{attempt.ExamId}/{attemptId}/{storedFileName}";
        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var absoluteDirectory = Path.Combine(webRoot, "uploads", "proctoring", attempt.ExamId.ToString(), attemptId.ToString());

        Directory.CreateDirectory(absoluteDirectory);

        var absolutePath = Path.Combine(absoluteDirectory, storedFileName);
        var publicUrl = relativeUrl;

        await using (var stream = File.Create(absolutePath))
        {
            await fileStream.CopyToAsync(stream, ct);
        }

        var evidence = new ProctoringEvidence
        {
            ExamAttemptId = attemptId,
            EvidenceType = string.IsNullOrWhiteSpace(evidenceType) ? "Snapshot" : evidenceType.Trim(),
            FileUrl = publicUrl,
            CaptureSource = string.IsNullOrWhiteSpace(captureSource) ? "TeacherManual" : captureSource.Trim(),
            TriggerEventType = string.IsNullOrWhiteSpace(triggerEventType) ? null : triggerEventType.Trim(),
            Metadata = string.IsNullOrWhiteSpace(metadata) ? null : metadata.Trim(),
            TriggeredByUserId = userId,
            CapturedAt = DateTime.UtcNow
        };

        await _proctoringRepository.AddEvidenceAsync(evidence, ct);

        var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct);
        if (state is not null)
        {
            state.EvidenceCount += 1;
            await _proctoringRepository.UpsertStateAsync(state, ct);
        }

        return new ProctoringEvidenceDto
        {
            Id = evidence.Id,
            EvidenceType = evidence.EvidenceType,
            FileUrl = evidence.FileUrl,
            ThumbnailUrl = evidence.ThumbnailUrl,
            CaptureSource = evidence.CaptureSource,
            TriggerEventType = evidence.TriggerEventType,
            Confidence = evidence.Confidence,
            CapturedAt = evidence.CapturedAt
        };
    }
}
