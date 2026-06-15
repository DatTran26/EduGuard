using EduGuard.Application.DTOs.Exams;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class PatchExamRequestValidator : AbstractValidator<PatchExamRequest>
{
    public PatchExamRequestValidator()
    {
        RuleFor(x => x)
            .Must(HasAnyField)
            .WithMessage("Phải có ít nhất một trường để cập nhật.");

        When(x => x.Title.IsSpecified, () =>
        {
            RuleFor(x => x.Title.Value).NotEmpty().MaximumLength(300);
        });

        When(x => x.DurationMinutes.IsSpecified, () =>
        {
            RuleFor(x => x.DurationMinutes.Value).GreaterThan(0);
        });

        When(x => x.Settings.IsSpecified && x.Settings.Value is not null &&
                  x.Settings.Value.MaxAttempts.IsSpecified, () =>
        {
            RuleFor(x => x.Settings.Value!.MaxAttempts.Value).GreaterThan(0);
        });
    }

    private static bool HasAnyField(PatchExamRequest x) =>
        x.Title.IsSpecified || x.Description.IsSpecified ||
        x.DurationMinutes.IsSpecified || x.StartTime.IsSpecified ||
        x.EndTime.IsSpecified || x.EnableAntiCheat.IsSpecified ||
        (x.Settings.IsSpecified && x.Settings.Value is not null &&
         (x.Settings.Value.ShuffleQuestions.IsSpecified ||
          x.Settings.Value.ShuffleAnswers.IsSpecified ||
          x.Settings.Value.MaxAttempts.IsSpecified ||
          x.Settings.Value.ShowResultAfterSubmit.IsSpecified ||
          x.Settings.Value.RequireFullscreen.IsSpecified));
}
