using System.Net;
using System.Net.Mail;
using EduGuard.Application.Services.Interfaces;

namespace EduGuard.Infrastructure.Email;

internal static class SmtpMailTransport
{
    public static async Task SendAsync(
        EmailRuntimeSettings settings,
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(settings.Host))
            throw new InvalidOperationException("Máy chủ SMTP chưa được cấu hình.");

        using var message = new MailMessage
        {
            From = new MailAddress(settings.FromAddress, settings.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(toEmail);

        using var client = new SmtpClient(settings.Host, settings.Port)
        {
            EnableSsl = settings.UseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        if (!string.IsNullOrWhiteSpace(settings.Username))
            client.Credentials = new NetworkCredential(settings.Username, settings.Password);

        await client.SendMailAsync(message, ct);
    }
}
