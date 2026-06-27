using EduGuard.Application.DTOs.Settings;

namespace EduGuard.Application.Services.Interfaces;

public interface IGptSettingsService
{
    Task<GptSettingsDto> GetAdminSettingsAsync(CancellationToken ct = default);
    Task<GptSettingsDto> UpdateAdminSettingsAsync(UpdateGptSettingsRequest request, CancellationToken ct = default);
    Task<GptRuntimeSettings> GetRuntimeSettingsAsync(CancellationToken ct = default);
    Task<string> ResolveApiKeyForTestAsync(string? submittedApiKey, CancellationToken ct = default);
}

public sealed class GptRuntimeSettings
{
    public string ApiKey { get; init; } = string.Empty;
    public string Model { get; init; } = "gpt-5.4";
    public string BaseUrl { get; init; } = "https://api.openai.com/v1";
}
