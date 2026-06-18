using EduGuard.Application.DTOs.Auth;
using EduGuard.Application.DTOs.Users;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Users;

public class UserService : IUserService
{
    private static readonly string[] RolePriority = ["Admin", "Teacher", "Student"];

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly AppDbContext _db;
    private readonly IValidator<CreateUserRequest> _createValidator;
    private readonly IValidator<UpdateUserRequest> _updateValidator;

    public UserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        AppDbContext db,
        IValidator<CreateUserRequest> createValidator,
        IValidator<UpdateUserRequest> updateValidator)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await _userManager.Users
            .AsNoTracking()
            .OrderBy(x => x.FullName)
            .ThenBy(x => x.Email)
            .ToListAsync(ct);

        var roleLookup = await LoadRoleLookupAsync(users.Select(x => x.Id).ToList(), ct);

        return users
            .Select(user => MapUser(user, roleLookup.GetValueOrDefault(user.Id, [])))
            .ToList();
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, ct);

        var roleName = NormalizeRoleName(request.Role);
        await EnsureRoleExistsAsync(roleName);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            FullName = request.FullName.Trim(),
            IsActive = request.IsActive,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            throw CreateIdentityException(createResult);

        var roleResult = await _userManager.AddToRoleAsync(user, roleName);
        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            throw CreateIdentityException(roleResult);
        }

        return MapUser(user, [roleName]);
    }

    public async Task<UserDto> UpdateAsync(
        string userId,
        UpdateUserRequest request,
        string currentUserId,
        CancellationToken ct = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, ct);

        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        var roleName = NormalizeRoleName(request.Role);
        await EnsureRoleExistsAsync(roleName);
        EnsureSelfUpdateIsSafe(user, request, currentUserId, roleName);

        var currentRoles = await _userManager.GetRolesAsync(user);
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedCurrentRoles = NormalizeRoles(currentRoles);
        var isRoleChanged = normalizedCurrentRoles.Count != 1 || normalizedCurrentRoles[0] != roleName;
        var isStatusChanged = user.IsActive != request.IsActive;
        var isEmailChanged = !string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase);

        user.FullName = request.FullName.Trim();
        user.Email = normalizedEmail;
        user.UserName = normalizedEmail;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            throw CreateIdentityException(updateResult);

        if (isRoleChanged)
        {
            if (currentRoles.Count > 0)
            {
                var removeRoleResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeRoleResult.Succeeded)
                    throw CreateIdentityException(removeRoleResult);
            }

            var addRoleResult = await _userManager.AddToRoleAsync(user, roleName);
            if (!addRoleResult.Succeeded)
                throw CreateIdentityException(addRoleResult);
        }

        if (isRoleChanged || isStatusChanged || isEmailChanged)
            await RevokeActiveRefreshTokensAsync(user.Id, ct);

        return MapUser(user, isRoleChanged ? [roleName] : normalizedCurrentRoles);
    }

    public async Task DeleteAsync(string userId, string currentUserId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        if (string.Equals(user.Id, currentUserId, StringComparison.Ordinal))
            throw new InvalidOperationException("Bạn không thể xóa tài khoản của chính mình.");

        await EnsureUserCanBeDeletedAsync(userId, ct);

        var deleteResult = await _userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded)
            throw CreateIdentityException(deleteResult);
    }

    private async Task<Dictionary<string, List<string>>> LoadRoleLookupAsync(
        IReadOnlyCollection<string> userIds,
        CancellationToken ct)
    {
        if (userIds.Count == 0)
            return [];

        var pairs = await (
            from userRole in _db.Set<IdentityUserRole<string>>()
            join role in _db.Set<IdentityRole>() on userRole.RoleId equals role.Id
            where userIds.Contains(userRole.UserId)
            select new
            {
                userRole.UserId,
                RoleName = role.Name
            })
            .ToListAsync(ct);

        return pairs
            .Where(x => !string.IsNullOrWhiteSpace(x.RoleName))
            .GroupBy(x => x.UserId)
            .ToDictionary(
                group => group.Key,
                group => NormalizeRoles(group.Select(x => x.RoleName!)).ToList());
    }

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        if (!await _roleManager.RoleExistsAsync(roleName))
            throw new InvalidOperationException("Vai trò không tồn tại trong hệ thống.");
    }

    private void EnsureSelfUpdateIsSafe(
        ApplicationUser targetUser,
        UpdateUserRequest request,
        string currentUserId,
        string roleName)
    {
        if (!string.Equals(targetUser.Id, currentUserId, StringComparison.Ordinal))
            return;

        if (!request.IsActive)
            throw new InvalidOperationException("Bạn không thể khóa tài khoản của chính mình.");

        if (!string.Equals(roleName, "Admin", StringComparison.Ordinal))
            throw new InvalidOperationException("Bạn không thể gỡ quyền Admin của chính mình.");
    }

    private async Task EnsureUserCanBeDeletedAsync(string userId, CancellationToken ct)
    {
        var hasRelatedData = await _db.Classrooms.AnyAsync(x => x.TeacherId == userId, ct)
            || await _db.ClassroomMembers.AnyAsync(x => x.StudentId == userId, ct)
            || await _db.Assignments.AnyAsync(x => x.TeacherId == userId, ct)
            || await _db.Exams.AnyAsync(x => x.TeacherId == userId, ct)
            || await _db.ExamAttempts.AnyAsync(x => x.StudentId == userId, ct)
            || await _db.Submissions.AnyAsync(x => x.StudentId == userId, ct);

        if (hasRelatedData)
        {
            throw new InvalidOperationException(
                "Người dùng này đã phát sinh dữ liệu liên quan. Hãy khóa tài khoản thay vì xóa.");
        }
    }

    private async Task RevokeActiveRefreshTokensAsync(string userId, CancellationToken ct)
    {
        var activeTokens = await _db.RefreshTokens
            .Where(x => x.UserId == userId && !x.IsRevoked)
            .ToListAsync(ct);

        if (activeTokens.Count == 0)
            return;

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }

    private static string NormalizeRoleName(string? role)
    {
        var normalizedRole = RolePriority.FirstOrDefault(candidate =>
            string.Equals(candidate, role?.Trim(), StringComparison.OrdinalIgnoreCase));

        if (normalizedRole is null)
            throw new InvalidOperationException("Vai trò không hợp lệ.");

        return normalizedRole;
    }

    private static List<string> NormalizeRoles(IEnumerable<string> roles)
    {
        return roles
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => NormalizeRoleName(role))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(GetRoleSortOrder)
            .ThenBy(role => role, StringComparer.Ordinal)
            .ToList();
    }

    private static int GetRoleSortOrder(string role)
    {
        var index = Array.IndexOf(RolePriority, role);
        return index >= 0 ? index : int.MaxValue;
    }

    private static InvalidOperationException CreateIdentityException(IdentityResult result)
    {
        return new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
    }

    private static UserDto MapUser(ApplicationUser user, IEnumerable<string> roles) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email ?? string.Empty,
        AvatarUrl = user.AvatarUrl,
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt,
        Roles = NormalizeRoles(roles)
    };
}
