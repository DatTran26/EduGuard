using System.Security.Cryptography;
using EduGuard.Application.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace EduGuard.Infrastructure.Auth;

internal sealed class EmailVerificationCacheEntry
{
    public string Code { get; init; } = string.Empty;
    public DateTime ExpiresAtUtc { get; init; }
}

internal sealed class EmailVerificationResendEntry
{
    public DateTime NextAllowedAtUtc { get; init; }
}

public class EmailVerificationService : IEmailVerificationService
{
    private const string OtpCachePrefix = "email-verification:otp:";
    private const string ResendCachePrefix = "email-verification:resend:";

    private readonly IMemoryCache _cache;
    private readonly IEmailSettingsService _emailSettingsService;

    public EmailVerificationService(
        IMemoryCache cache,
        IEmailSettingsService emailSettingsService)
    {
        _cache = cache;
        _emailSettingsService = emailSettingsService;
    }

    public async Task<string> CreateAndStoreOtpAsync(string email, CancellationToken ct = default)
    {
        var options = await _emailSettingsService.GetRuntimeSettingsAsync(ct);
        var normalizedEmail = NormalizeEmail(email);
        var code = GenerateNumericCode(options.OtpLength);
        var entry = new EmailVerificationCacheEntry
        {
            Code = code,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(options.OtpExpiryMinutes)
        };

        _cache.Set(
            BuildOtpKey(normalizedEmail),
            entry,
            TimeSpan.FromMinutes(options.OtpExpiryMinutes));

        return code;
    }

    public Task<bool> ValidateOtpAsync(string email, string code, CancellationToken ct = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (!_cache.TryGetValue(BuildOtpKey(normalizedEmail), out EmailVerificationCacheEntry? entry))
            return Task.FromResult(false);

        if (entry is null || entry.ExpiresAtUtc <= DateTime.UtcNow)
            return Task.FromResult(false);

        var isValid = string.Equals(entry.Code, code.Trim(), StringComparison.Ordinal);
        if (isValid)
            _cache.Remove(BuildOtpKey(normalizedEmail));

        return Task.FromResult(isValid);
    }

    public async Task<bool> CanResendAsync(string email, CancellationToken ct = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (!_cache.TryGetValue(BuildResendKey(normalizedEmail), out EmailVerificationResendEntry? entry))
            return true;

        return entry is null || entry.NextAllowedAtUtc <= DateTime.UtcNow;
    }

    public async Task MarkResentAsync(string email, CancellationToken ct = default)
    {
        var options = await _emailSettingsService.GetRuntimeSettingsAsync(ct);
        var normalizedEmail = NormalizeEmail(email);
        _cache.Set(
            BuildResendKey(normalizedEmail),
            new EmailVerificationResendEntry
            {
                NextAllowedAtUtc = DateTime.UtcNow.AddSeconds(options.ResendCooldownSeconds)
            },
            TimeSpan.FromSeconds(options.ResendCooldownSeconds));
    }

    private static string BuildOtpKey(string normalizedEmail) => $"{OtpCachePrefix}{normalizedEmail}";

    private static string BuildResendKey(string normalizedEmail) => $"{ResendCachePrefix}{normalizedEmail}";

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static string GenerateNumericCode(int length)
    {
        var max = (int)Math.Pow(10, length);
        var value = RandomNumberGenerator.GetInt32(0, max);
        return value.ToString($"D{length}");
    }
}
