namespace EduGuard.Application.Services.Interfaces;

public interface IEmailVerificationService
{
    Task<string> CreateAndStoreOtpAsync(string email, CancellationToken ct = default);
    Task<bool> ValidateOtpAsync(string email, string code, CancellationToken ct = default);
    Task<bool> CanResendAsync(string email, CancellationToken ct = default);
    Task MarkResentAsync(string email, CancellationToken ct = default);
}
