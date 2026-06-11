using EduGuard.Application.DTOs.Assignments;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class GradeSubmissionRequestValidator : AbstractValidator<GradeSubmissionRequest>
{
    public GradeSubmissionRequestValidator()
    {
        RuleFor(x => x.Score).GreaterThanOrEqualTo(0).LessThanOrEqualTo(100);
        RuleFor(x => x.Feedback).MaximumLength(2000);
    }
}
