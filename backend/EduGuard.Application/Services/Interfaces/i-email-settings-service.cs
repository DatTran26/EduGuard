using EduGuard.Application.DTOs.Settings;

namespace EduGuard.Application.Services.Interfaces;

public interface IEmailSettingsService
{
    Task<EmailSettingsDto> GetAdminSettingsAsync(CancellationToken ct = default);
    Task<EmailSettingsDto> UpdateAdminSettingsAsync(UpdateEmailSettingsRequest request, CancellationToken ct = default);
    Task SendTestEmailAsync(SendTestEmailRequest request, CancellationToken ct = default);
    Task<EmailRuntimeSettings> GetRuntimeSettingsAsync(CancellationToken ct = default);
}

public sealed class EmailRuntimeSettings
{
    public bool Enabled { get; init; }
    public string Host { get; init; } = string.Empty;
    public int Port { get; init; } = 587;
    public bool UseSsl { get; init; } = true;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FromAddress { get; init; } = string.Empty;
    public string FromName { get; init; } = string.Empty;
    public bool RequireOnRegister { get; init; } = true;
    public int OtpLength { get; init; } = 6;
    public int OtpExpiryMinutes { get; init; } = 10;
    public int ResendCooldownSeconds { get; init; } = 60;
}
