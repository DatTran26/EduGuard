using EduGuard.Application.DTOs.Assignments;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class UpdateAssignmentRequestValidator : AbstractValidator<UpdateAssignmentRequest>
{
    public UpdateAssignmentRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.MaxScore).GreaterThan(0).LessThanOrEqualTo(100);
    }
}
