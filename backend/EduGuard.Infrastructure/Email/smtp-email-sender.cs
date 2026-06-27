using EduGuard.Application.Services.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EduGuard.Infrastructure.Email;

public class SmtpEmailSender : IEmailSender
{
    private readonly IEmailSettingsService _emailSettingsService;
    private readonly IHostEnvironment _hostEnvironment;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(
        IEmailSettingsService emailSettingsService,
        IHostEnvironment hostEnvironment,
        ILogger<SmtpEmailSender> logger)
    {
        _emailSettingsService = emailSettingsService;
        _hostEnvironment = hostEnvironment;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        var settings = await _emailSettingsService.GetRuntimeSettingsAsync(ct);

        if (!settings.Enabled)
        {
            if (_hostEnvironment.IsDevelopment())
            {
                _logger.LogInformation(
                    "DEV email skipped (Enabled=false). To={Recipient}, Subject={Subject}, Body={Body}",
                    toEmail,
                    subject,
                    htmlBody);
            }
            else
            {
                _logger.LogWarning(
                    "Email sending is disabled. Skipped message to {Recipient}. Subject: {Subject}",
                    toEmail,
                    subject);
            }

            return;
        }

        await SmtpMailTransport.SendAsync(settings, toEmail, subject, htmlBody, ct);
    }
}
