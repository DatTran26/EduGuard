using EduGuard.Application.DTOs.Exams;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class CreateExamRequestValidator : AbstractValidator<CreateExamRequest>
{
    public CreateExamRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.DurationMinutes).GreaterThan(0);
        RuleFor(x => x.Settings.MaxAttempts).GreaterThan(0);
        RuleFor(x => x)
            .Must(x => !x.StartTime.HasValue || !x.EndTime.HasValue || x.EndTime > x.StartTime)
            .WithMessage("Thời gian đóng đề phải sau thời gian mở đề.");
    }
}
