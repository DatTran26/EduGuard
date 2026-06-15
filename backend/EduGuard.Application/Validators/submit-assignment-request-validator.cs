using EduGuard.Application.DTOs.Assignments;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class SubmitAssignmentRequestValidator : AbstractValidator<SubmitAssignmentRequest>
{
    public SubmitAssignmentRequestValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(4000);
    }
}
