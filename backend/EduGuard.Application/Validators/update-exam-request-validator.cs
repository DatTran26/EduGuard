using EduGuard.Application.DTOs.Exams;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class UpdateExamRequestValidator : AbstractValidator<UpdateExamRequest>
{
    public UpdateExamRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.DurationMinutes).GreaterThan(0);
        RuleFor(x => x.Settings).NotNull().WithMessage("Cấu hình đề thi không được để trống.");

        When(x => x.Settings is not null, () =>
        {
            RuleFor(x => x.Settings.MaxAttempts).GreaterThan(0);
        });

        RuleFor(x => x)
            .Must(HasValidTimeWindow)
            .WithMessage("Thời gian đóng đề phải sau thời gian mở đề.");
    }

    private static bool HasValidTimeWindow(UpdateExamRequest request) =>
        !request.StartTime.HasValue ||
        !request.EndTime.HasValue ||
        NormalizeUtc(request.EndTime.Value) > NormalizeUtc(request.StartTime.Value);

    private static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
