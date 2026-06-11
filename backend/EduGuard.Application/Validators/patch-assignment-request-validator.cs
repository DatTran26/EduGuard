using EduGuard.Application.DTOs.Assignments;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class PatchAssignmentRequestValidator : AbstractValidator<PatchAssignmentRequest>
{
    public PatchAssignmentRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.Title.IsSpecified || x.Description.IsSpecified ||
                       x.Deadline.IsSpecified || x.MaxScore.IsSpecified)
            .WithMessage("Phải có ít nhất một trường để cập nhật.");

        When(x => x.Title.IsSpecified, () =>
        {
            RuleFor(x => x.Title.Value).NotEmpty().MaximumLength(300);
        });

        When(x => x.Description.IsSpecified, () =>
        {
            RuleFor(x => x.Description.Value).MaximumLength(2000);
        });

        When(x => x.MaxScore.IsSpecified, () =>
        {
            RuleFor(x => x.MaxScore.Value).GreaterThan(0).LessThanOrEqualTo(100);
        });
    }
}
