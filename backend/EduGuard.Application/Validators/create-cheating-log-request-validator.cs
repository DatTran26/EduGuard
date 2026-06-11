using EduGuard.Application.DTOs.AntiCheat;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class CreateCheatingLogRequestValidator : AbstractValidator<CreateCheatingLogRequest>
{
    public CreateCheatingLogRequestValidator()
    {
        RuleFor(x => x.ExamAttemptId).GreaterThan(0);
        RuleFor(x => x.Type).NotEmpty().MaximumLength(32);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Metadata).MaximumLength(2000).When(x => x.Metadata is not null);
    }
}
