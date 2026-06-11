using EduGuard.Application.DTOs.Exams;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class PatchAnswerRequestValidator : AbstractValidator<PatchAnswerRequest>
{
    public PatchAnswerRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.Content.IsSpecified || x.IsCorrect.IsSpecified || x.OrderIndex.IsSpecified)
            .WithMessage("Phải có ít nhất một trường để cập nhật.");

        When(x => x.Content.IsSpecified, () =>
        {
            RuleFor(x => x.Content.Value).NotEmpty().MaximumLength(1000);
        });

        When(x => x.OrderIndex.IsSpecified, () =>
        {
            RuleFor(x => x.OrderIndex.Value).GreaterThan(0);
        });
    }
}
