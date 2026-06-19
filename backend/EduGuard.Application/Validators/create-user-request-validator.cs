using EduGuard.Application.DTOs.Users;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    private static readonly string[] AllowedRoles = ["Admin", "Teacher", "Student"];

    public CreateUserRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên không được để trống.")
            .MaximumLength(200).WithMessage("Họ tên không được vượt quá 200 ký tự.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không hợp lệ.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự.");

        RuleFor(x => x.Role)
            .Must(BeAllowedRole)
            .WithMessage("Vai trò không hợp lệ.");
    }

    private static bool BeAllowedRole(string? role)
    {
        return AllowedRoles.Contains(role?.Trim(), StringComparer.OrdinalIgnoreCase);
    }
}
