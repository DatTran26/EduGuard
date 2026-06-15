using EduGuard.Application.DTOs.Exams;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class PatchQuestionRequestValidator : AbstractValidator<PatchQuestionRequest>
{
    public PatchQuestionRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.Content.IsSpecified || x.QuestionType.IsSpecified ||
                       x.Score.IsSpecified || x.OrderIndex.IsSpecified)
            .WithMessage("Phải có ít nhất một trường để cập nhật.");

        When(x => x.Content.IsSpecified, () =>
        {
            RuleFor(x => x.Content.Value).NotEmpty().MaximumLength(2000);
        });

        When(x => x.Score.IsSpecified, () =>
        {
            RuleFor(x => x.Score.Value).GreaterThan(0);
        });

        When(x => x.OrderIndex.IsSpecified, () =>
        {
            RuleFor(x => x.OrderIndex.Value).GreaterThan(0);
        });

        When(x => x.QuestionType.IsSpecified, () =>
        {
            RuleFor(x => x.QuestionType.Value).IsInEnum();
        });
    }
}
