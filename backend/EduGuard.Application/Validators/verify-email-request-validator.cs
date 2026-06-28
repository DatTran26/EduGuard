using EduGuard.Application.DTOs.Auth;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class VerifyEmailRequestValidator : AbstractValidator<VerifyEmailRequest>
{
    public VerifyEmailRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Code)
            .NotEmpty()
            .Matches(@"^\d{6}$")
            .WithMessage("Mã xác thực phải gồm 6 chữ số.");
    }
}
