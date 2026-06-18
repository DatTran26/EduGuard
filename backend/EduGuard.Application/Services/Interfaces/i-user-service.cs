using EduGuard.Application.DTOs.Auth;
using EduGuard.Application.DTOs.Users;

namespace EduGuard.Application.Services.Interfaces;

public interface IUserService
{
    Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct = default);
    Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default);
    Task<UserDto> UpdateAsync(string userId, UpdateUserRequest request, string currentUserId, CancellationToken ct = default);
    Task DeleteAsync(string userId, string currentUserId, CancellationToken ct = default);
}
