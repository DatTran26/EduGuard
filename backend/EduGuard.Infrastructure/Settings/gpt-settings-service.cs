using EduGuard.Application.DTOs.Settings;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace EduGuard.Infrastructure.Settings;

public class GptSettingsService : IGptSettingsService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public GptSettingsService(AppDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task<GptSettingsDto> GetAdminSettingsAsync(CancellationToken ct = default)
    {
        var settings = await GetOrCreateSettingsAsync(ct);
        return MapAdminDto(settings);
    }

    public async Task<GptSettingsDto> UpdateAdminSettingsAsync(
        UpdateGptSettingsRequest request,
        CancellationToken ct = default)
    {
        var settings = await GetOrCreateSettingsAsync(ct);
        var submittedApiKey = request.ApiKey ?? string.Empty;

        if (!ShouldPreserveExistingApiKey(submittedApiKey))
            settings.ApiKey = submittedApiKey.Trim();

        settings.Model = string.IsNullOrWhiteSpace(request.Model) ? "gpt-5.4" : request.Model.Trim();
        settings.BaseUrl = string.IsNullOrWhiteSpace(request.BaseUrl)
            ? "https://api.openai.com/v1"
            : request.BaseUrl.Trim();
        settings.UpdatedAt = DateTime.UtcNow;

        _db.GptSettings.Update(settings);
        await _db.SaveChangesAsync(ct);

        return MapAdminDto(settings);
    }

    public async Task<GptRuntimeSettings> GetRuntimeSettingsAsync(CancellationToken ct = default)
    {
        var settings = await GetOrCreateSettingsAsync(ct);
        var runtime = MapRuntimeSettings(settings);

        if (string.IsNullOrWhiteSpace(runtime.ApiKey))
        {
            return new GptRuntimeSettings
            {
                ApiKey = ResolveFallbackApiKey(),
                Model = string.IsNullOrWhiteSpace(runtime.Model) ? ResolveFallbackModel() : runtime.Model,
                BaseUrl = string.IsNullOrWhiteSpace(runtime.BaseUrl) ? ResolveFallbackBaseUrl() : runtime.BaseUrl
            };
        }

        return runtime;
    }

    public async Task<string> ResolveApiKeyForTestAsync(string? submittedApiKey, CancellationToken ct = default)
    {
        var settings = await GetOrCreateSettingsAsync(ct);
        var apiKey = submittedApiKey ?? string.Empty;

        if (ShouldPreserveExistingApiKey(apiKey))
            apiKey = settings.ApiKey;

        if (string.IsNullOrWhiteSpace(apiKey))
            apiKey = ResolveFallbackApiKey();

        return apiKey;
    }

    private async Task<GptSettings> GetOrCreateSettingsAsync(CancellationToken ct)
    {
        var settings = await _db.GptSettings.FirstOrDefaultAsync(x => x.Id == 1, ct);
        if (settings is not null)
            return settings;

        settings = new GptSettings
        {
            Id = 1,
            ApiKey = ResolveFallbackApiKey(),
            Model = ResolveFallbackModel(),
            BaseUrl = ResolveFallbackBaseUrl(),
            UpdatedAt = DateTime.UtcNow
        };

        _db.GptSettings.Add(settings);
        await _db.SaveChangesAsync(ct);
        return settings;
    }

    private string ResolveFallbackApiKey() =>
        Environment.GetEnvironmentVariable("OPENAI_API_KEY")
        ?? _configuration["OpenAI:ApiKey"]
        ?? string.Empty;

    private string ResolveFallbackModel() =>
        Environment.GetEnvironmentVariable("OPENAI_MODEL")
        ?? _configuration["OpenAI:Model"]
        ?? "gpt-5.4";

    private string ResolveFallbackBaseUrl() =>
        Environment.GetEnvironmentVariable("OPENAI_BASE_URL")
        ?? _configuration["OpenAI:BaseUrl"]
        ?? "https://api.openai.com/v1";

    private static bool ShouldPreserveExistingApiKey(string apiKey) =>
        string.IsNullOrWhiteSpace(apiKey) || apiKey.Contains("...");

    private static GptSettingsDto MapAdminDto(GptSettings settings) => new()
    {
        ApiKey = MaskApiKey(settings.ApiKey),
        Model = settings.Model,
        BaseUrl = settings.BaseUrl
    };

    private static GptRuntimeSettings MapRuntimeSettings(GptSettings settings)
    {
        var apiKey = settings.ApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
            apiKey = string.Empty;

        return new GptRuntimeSettings
        {
            ApiKey = apiKey,
            Model = string.IsNullOrWhiteSpace(settings.Model) ? "gpt-5.4" : settings.Model,
            BaseUrl = string.IsNullOrWhiteSpace(settings.BaseUrl)
                ? "https://api.openai.com/v1"
                : settings.BaseUrl
        };
    }

    private static string MaskApiKey(string apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return string.Empty;

        return apiKey.Length > 8
            ? $"{apiKey[..4]}...{apiKey[^4..]}"
            : "sk-proj-...";
    }
}
