using EduGuard.Application.DTOs.Auth;

namespace EduGuard.Application.Services.Interfaces;

public interface IAuthService
{
    Task<UserDto> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<LoginResponse> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
    Task<UserDto> GetMeAsync(int userId, CancellationToken ct = default);
}
