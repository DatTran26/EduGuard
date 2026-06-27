namespace EduGuard.Application.Options;

public class EmailVerificationOptions
{
    public const string SectionName = "EmailVerification";

    public bool RequireOnRegister { get; set; } = true;
    public int OtpLength { get; set; } = 6;
    public int OtpExpiryMinutes { get; set; } = 10;
    public int ResendCooldownSeconds { get; set; } = 60;
}
