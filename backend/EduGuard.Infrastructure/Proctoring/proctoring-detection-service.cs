using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EduGuard.Infrastructure.Proctoring;

public class ProctoringDetectionService : IProctoringDetectionService
{
    private readonly AppDbContext _db;
    private readonly IAntiCheatService _antiCheatService;
    private readonly IExamMonitoringNotifier _examMonitoringNotifier;
    private readonly IExamMonitoringService _examMonitoringService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IProctoringEvidenceService _proctoringEvidenceService;
    private readonly IProctoringRepository _proctoringRepository;
    private readonly ILogger<ProctoringDetectionService> _logger;

    public ProctoringDetectionService(
        AppDbContext db,
        IAntiCheatService antiCheatService,
        IExamMonitoringNotifier examMonitoringNotifier,
        IExamMonitoringService examMonitoringService,
        IHttpClientFactory httpClientFactory,
        IProctoringEvidenceService proctoringEvidenceService,
        IProctoringRepository proctoringRepository,
        ILogger<ProctoringDetectionService> logger)
    {
        _db = db;
        _antiCheatService = antiCheatService;
        _examMonitoringNotifier = examMonitoringNotifier;
        _examMonitoringService = examMonitoringService;
        _httpClientFactory = httpClientFactory;
        _proctoringEvidenceService = proctoringEvidenceService;
        _proctoringRepository = proctoringRepository;
        _logger = logger;
    }

    public async Task<ProctoringDetectionResultDto> DetectAsync(
        int attemptId,
        string userId,
        IReadOnlyList<string> roles,
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken ct = default)
    {
        var attempt = await _db.ExamAttempts
            .AsNoTracking()
            .Include(x => x.Student)
            .FirstOrDefaultAsync(x => x.Id == attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        if (roles.Contains("Student"))
        {
            if (attempt.StudentId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền gửi frame cho lượt làm này.");
        }
        else
        {
            await _examMonitoringService.EnsureCanMonitorExamAsync(attempt.ExamId, userId, roles, ct);
        }

        var settings = await _proctoringRepository.GetAiSettingsAsync(ct);
        if (!settings.EnableYoloDetection || string.IsNullOrWhiteSpace(settings.AiServiceBaseUrl))
        {
            return new ProctoringDetectionResultDto
            {
                DetectionType = "Disabled",
                Confidence = 0,
                IsFlagged = false,
                Message = "AI detection đang tắt."
            };
        }

        await using var buffer = new MemoryStream();
        await fileStream.CopyToAsync(buffer, ct);
        buffer.Position = 0;

        using var content = new MultipartFormDataContent();
        using var streamContent = new StreamContent(buffer);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(streamContent, "file", fileName);

        var client = _httpClientFactory.CreateClient("ProctoringAi");
        var response = await client.PostAsync($"{settings.AiServiceBaseUrl.TrimEnd('/')}/detect", content, ct);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        var detectionType = payload.TryGetProperty("detectionType", out var typeElement)
            ? typeElement.GetString() ?? "Unknown"
            : "Unknown";
        var confidence = payload.TryGetProperty("confidence", out var confidenceElement)
            ? confidenceElement.GetDecimal()
            : 0m;
        var labels = payload.TryGetProperty("labels", out var labelsElement) && labelsElement.ValueKind == JsonValueKind.Array
            ? labelsElement.EnumerateArray().Select(x => x.GetString() ?? string.Empty).Where(x => x.Length > 0).ToList()
            : new List<string>();
        var boxes = payload.TryGetProperty("boxes", out var boxesElement) && boxesElement.ValueKind == JsonValueKind.Array
            ? boxesElement.GetRawText()
            : null;

        var isFlagged = detectionType switch
        {
            "PhoneVisible" => confidence >= settings.PhoneVisibleMinConfidence,
            "BookVisible" => confidence >= settings.BookVisibleMinConfidence,
            "MultipleFaces" => confidence >= settings.SecondPersonMinConfidence,
            "PersonNotVisible" => confidence >= settings.SecondPersonMinConfidence,
            _ => false
        };

        if (isFlagged)
        {
            var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct);
            if (state is not null)
            {
                state.LatestDetectionType = detectionType;
                state.SuspicionScore += 10;
                state.RiskLevel = ProctoringRiskHelper.GetRiskLevel(state.SuspicionScore);
                await _proctoringRepository.UpsertStateAsync(state, ct);
            }

            buffer.Position = 0;
            var evidenceRoles = roles.Contains("Student") ? new List<string> { "Student" } : roles.ToList();
            var parsedBoxes = JsonSerializer.Deserialize<JsonElement>(boxes ?? "[]");
            var metadata = JsonSerializer.Serialize(new
            {
                detectionType,
                confidence,
                labels,
                boxes = parsedBoxes
            });
            await _proctoringEvidenceService.SaveEvidenceAsync(
                attemptId,
                userId,
                evidenceRoles,
                buffer,
                fileName,
                contentType,
                "AutoDetect",
                roles.Contains("Student") ? "StudentAuto" : "TeacherManual",
                detectionType,
                metadata,
                ct);

            var cheatingType = MapDetectionToCheatingType(detectionType);
            if (cheatingType is not null)
            {
                try
                {
                    await ProctoringCheatingLogHelper.LogProctoringSignalAsync(
                        _antiCheatService,
                        attemptId,
                        attempt.StudentId,
                        cheatingType.Value,
                        $"AI phát hiện: {detectionType}",
                        metadata,
                        ct);
                }
                catch
                {
                    // Detection response should still succeed if anti-cheat log fails.
                }
            }
        }
        else
        {
            var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct);
            if (state is not null)
            {
                state.LatestDetectionType = detectionType;
                await _proctoringRepository.UpsertStateAsync(state, ct);
            }
        }

        var result = new ProctoringDetectionResultDto
        {
            DetectionType = detectionType,
            Confidence = confidence,
            IsFlagged = isFlagged,
            Labels = labels,
            Message = isFlagged ? "Có dấu hiệu bất thường cần theo dõi." : "Không phát hiện dấu hiệu vượt ngưỡng."
        };

        _logger.LogInformation(
            "AI detect attempt {AttemptId} exam {ExamId}: type={DetectionType} confidence={Confidence} flagged={IsFlagged} labels={Labels}",
            attemptId,
            attempt.ExamId,
            detectionType,
            confidence,
            isFlagged,
            string.Join(", ", labels));

        try
        {
            await _examMonitoringNotifier.SendAiDetectionAsync(new AiDetectionEventDto
            {
                ExamId = attempt.ExamId,
                ExamAttemptId = attemptId,
                StudentId = attempt.StudentId,
                StudentName = attempt.Student?.FullName ?? string.Empty,
                DetectionType = detectionType,
                Confidence = confidence,
                IsFlagged = isFlagged,
                Message = result.Message,
                Labels = labels,
                OccurredAt = DateTime.UtcNow
            }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không gửi được sự kiện AI detection realtime cho đề thi {ExamId}.", attempt.ExamId);
        }

        return result;
    }

    private static CheatingType? MapDetectionToCheatingType(string detectionType) =>
        detectionType switch
        {
            "PhoneVisible" => CheatingType.PhoneVisible,
            "BookVisible" => CheatingType.BookVisible,
            "MultipleFaces" => CheatingType.SecondPersonVisible,
            "PersonNotVisible" => CheatingType.PersonNotVisible,
            _ => null
        };
}
