using Microsoft.AspNetCore.Identity;

namespace EduGuard.Domain.Entities;

public class ApplicationUser : IdentityUser<int>
{
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<Classroom> OwnedClassrooms { get; set; } = [];
    public ICollection<ClassroomMember> ClassroomMemberships { get; set; } = [];
}
