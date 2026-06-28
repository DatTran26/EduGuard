namespace EduGuard.Application.DTOs.Settings;

public class EmailSettingsDto
{
    public bool Enabled { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public bool UseSsl { get; set; }
    public string Username { get; set; } = string.Empty;
    public bool HasPassword { get; set; }
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public bool RequireOnRegister { get; set; }
    public int OtpLength { get; set; }
    public int OtpExpiryMinutes { get; set; }
    public int ResendCooldownSeconds { get; set; }
}

public class UpdateEmailSettingsRequest
{
    public bool Enabled { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public bool RequireOnRegister { get; set; } = true;
    public int OtpLength { get; set; } = 6;
    public int OtpExpiryMinutes { get; set; } = 10;
    public int ResendCooldownSeconds { get; set; } = 60;
}

public class SendTestEmailRequest
{
    public string RecipientEmail { get; set; } = string.Empty;
}
