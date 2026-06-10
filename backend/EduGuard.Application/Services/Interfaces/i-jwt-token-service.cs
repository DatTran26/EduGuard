using EduGuard.Domain.Entities;

namespace EduGuard.Application.Services.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);
}
