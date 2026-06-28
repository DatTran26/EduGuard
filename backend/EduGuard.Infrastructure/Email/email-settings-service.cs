using EduGuard.Application.DTOs.Settings;
using EduGuard.Application.Options;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduGuard.Infrastructure.Email;

public class EmailSettingsService : IEmailSettingsService
{
    private readonly AppDbContext _db;
    private readonly IValidator<UpdateEmailSettingsRequest> _updateValidator;
    private readonly IValidator<SendTestEmailRequest> _testValidator;
    private readonly EmailOptions _defaultEmailOptions;
    private readonly EmailVerificationOptions _defaultVerificationOptions;

    public EmailSettingsService(
        AppDbContext db,
        IValidator<UpdateEmailSettingsRequest> updateValidator,
        IValidator<SendTestEmailRequest> testValidator,
        IOptions<EmailOptions> defaultEmailOptions,
        IOptions<EmailVerificationOptions> defaultVerificationOptions)
    {
        _db = db;
        _updateValidator = updateValidator;
        _testValidator = testValidator;
        _defaultEmailOptions = defaultEmailOptions.Value;
        _defaultVerificationOptions = defaultVerificationOptions.Value;
    }

    public async Task<EmailSettingsDto> GetAdminSettingsAsync(CancellationToken ct = default)
    {
        var settings = await GetOrCreateSettingsAsync(ct);
        return MapAdminDto(settings);
    }

    public async Task<EmailSettingsDto> UpdateAdminSettingsAsync(
        UpdateEmailSettingsRequest request,
        CancellationToken ct = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, ct);

        var settings = await GetOrCreateSettingsAsync(ct);
        settings.Enabled = request.Enabled;
        settings.Host = request.Host.Trim();
        settings.Port = request.Port;
        settings.UseSsl = request.UseSsl;
        settings.Username = request.Username.Trim();
        if (!string.IsNullOrWhiteSpace(request.Password))
            settings.Password = request.Password;
        settings.FromAddress = request.FromAddress.Trim();
        settings.FromName = request.FromName.Trim();
        settings.RequireOnRegister = request.RequireOnRegister;
        settings.OtpLength = request.OtpLength;
        settings.OtpExpiryMinutes = request.OtpExpiryMinutes;
        settings.ResendCooldownSeconds = request.ResendCooldownSeconds;
        settings.UpdatedAt = DateTime.UtcNow;

        _db.EmailSettings.Update(settings);
        await _db.SaveChangesAsync(ct);

        return MapAdminDto(settings);
    }

    public async Task SendTestEmailAsync(SendTestEmailRequest request, CancellationToken ct = default)
    {
        await _testValidator.ValidateAndThrowAsync(request, ct);

        var runtime = await GetRuntimeSettingsAsync(ct);
        if (!runtime.Enabled)
            throw new InvalidOperationException("Gửi email đang tắt. Hãy bật cấu hình trước khi gửi thử.");

        if (string.IsNullOrWhiteSpace(runtime.Host))
            throw new InvalidOperationException("Chưa cấu hình máy chủ SMTP.");

        await SmtpMailTransport.SendAsync(
            runtime,
            request.RecipientEmail.Trim(),
            "EduGuard — Email thử nghiệm",
            """
            <p>Xin chào,</p>
            <p>Đây là email thử nghiệm từ EduGuard. Cấu hình Gmail/SMTP của bạn đã hoạt động.</p>
            """,
            ct);
    }

    public async Task<EmailRuntimeSettings> GetRuntimeSettingsAsync(CancellationToken ct = default)
    {
        var settings = await GetOrCreateSettingsAsync(ct);
        return MapRuntimeSettings(settings);
    }

    private async Task<EmailSettings> GetOrCreateSettingsAsync(CancellationToken ct)
    {
        var settings = await _db.EmailSettings.FirstOrDefaultAsync(x => x.Id == 1, ct);
        if (settings is not null)
            return settings;

        settings = new EmailSettings
        {
            Id = 1,
            Enabled = _defaultEmailOptions.Enabled,
            Host = string.IsNullOrWhiteSpace(_defaultEmailOptions.Host)
                ? "smtp.gmail.com"
                : _defaultEmailOptions.Host,
            Port = _defaultEmailOptions.Port,
            UseSsl = _defaultEmailOptions.UseSsl,
            Username = _defaultEmailOptions.Username,
            Password = _defaultEmailOptions.Password,
            FromAddress = _defaultEmailOptions.FromAddress,
            FromName = _defaultEmailOptions.FromName,
            RequireOnRegister = _defaultVerificationOptions.RequireOnRegister,
            OtpLength = _defaultVerificationOptions.OtpLength,
            OtpExpiryMinutes = _defaultVerificationOptions.OtpExpiryMinutes,
            ResendCooldownSeconds = _defaultVerificationOptions.ResendCooldownSeconds,
            UpdatedAt = DateTime.UtcNow
        };

        _db.EmailSettings.Add(settings);
        await _db.SaveChangesAsync(ct);
        return settings;
    }

    private static EmailSettingsDto MapAdminDto(EmailSettings settings) => new()
    {
        Enabled = settings.Enabled,
        Host = settings.Host,
        Port = settings.Port,
        UseSsl = settings.UseSsl,
        Username = settings.Username,
        HasPassword = !string.IsNullOrWhiteSpace(settings.Password),
        FromAddress = settings.FromAddress,
        FromName = settings.FromName,
        RequireOnRegister = settings.RequireOnRegister,
        OtpLength = settings.OtpLength,
        OtpExpiryMinutes = settings.OtpExpiryMinutes,
        ResendCooldownSeconds = settings.ResendCooldownSeconds
    };

    private static EmailRuntimeSettings MapRuntimeSettings(EmailSettings settings) => new()
    {
        Enabled = settings.Enabled,
        Host = settings.Host,
        Port = settings.Port,
        UseSsl = settings.UseSsl,
        Username = settings.Username,
        Password = settings.Password,
        FromAddress = settings.FromAddress,
        FromName = settings.FromName,
        RequireOnRegister = settings.RequireOnRegister,
        OtpLength = settings.OtpLength,
        OtpExpiryMinutes = settings.OtpExpiryMinutes,
        ResendCooldownSeconds = settings.ResendCooldownSeconds
    };
}
