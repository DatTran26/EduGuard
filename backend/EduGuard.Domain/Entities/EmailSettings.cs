namespace EduGuard.Domain.Entities;

public class EmailSettings
{
    public int Id { get; set; } = 1;
    public bool Enabled { get; set; }
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "noreply@eduguard.local";
    public string FromName { get; set; } = "EduGuard";
    public bool RequireOnRegister { get; set; } = true;
    public int OtpLength { get; set; } = 6;
    public int OtpExpiryMinutes { get; set; } = 10;
    public int ResendCooldownSeconds { get; set; } = 60;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
