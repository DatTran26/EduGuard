using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Proctoring;

public class ProctoringDetectionService : IProctoringDetectionService
{
    private readonly AppDbContext _db;
    private readonly IExamMonitoringService _examMonitoringService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IProctoringRepository _proctoringRepository;

    public ProctoringDetectionService(
        AppDbContext db,
        IExamMonitoringService examMonitoringService,
        IHttpClientFactory httpClientFactory,
        IProctoringRepository proctoringRepository)
    {
        _db = db;
        _examMonitoringService = examMonitoringService;
        _httpClientFactory = httpClientFactory;
        _proctoringRepository = proctoringRepository;
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
        var attempt = await _db.ExamAttempts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        await _examMonitoringService.EnsureCanMonitorExamAsync(attempt.ExamId, userId, roles, ct);

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

        using var content = new MultipartFormDataContent();
        using var streamContent = new StreamContent(fileStream);
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

        var isFlagged = detectionType switch
        {
            "PhoneVisible" => confidence >= settings.PhoneVisibleMinConfidence,
            "BookVisible" => confidence >= settings.BookVisibleMinConfidence,
            "MultipleFaces" => confidence >= settings.SecondPersonMinConfidence,
            _ => false
        };

        if (isFlagged)
        {
            var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct);
            if (state is not null)
            {
                state.LatestDetectionType = detectionType;
                state.SuspicionScore = Math.Min(state.SuspicionScore + 10, 100);
                state.RiskLevel = ProctoringRiskHelper.GetRiskLevel(state.SuspicionScore);
                await _proctoringRepository.UpsertStateAsync(state, ct);
            }
        }

        return new ProctoringDetectionResultDto
        {
            DetectionType = detectionType,
            Confidence = confidence,
            IsFlagged = isFlagged,
            Message = isFlagged ? "Có dấu hiệu bất thường cần theo dõi." : "Không phát hiện dấu hiệu vượt ngưỡng."
        };
    }
}
