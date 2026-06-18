using EduGuard.Application.DTOs.Users;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    private static readonly string[] AllowedRoles = ["Admin", "Teacher", "Student"];

    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên không được để trống.")
            .MaximumLength(200).WithMessage("Họ tên không được vượt quá 200 ký tự.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không hợp lệ.");

        RuleFor(x => x.Role)
            .Must(BeAllowedRole)
            .WithMessage("Vai trò không hợp lệ.");
    }

    private static bool BeAllowedRole(string? role)
    {
        return AllowedRoles.Contains(role?.Trim(), StringComparer.OrdinalIgnoreCase);
    }
}
