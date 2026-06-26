using EduGuard.Application.DTOs.Assignments;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class CreateAssignmentRequestValidator : AbstractValidator<CreateAssignmentRequest>
{
    public CreateAssignmentRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Deadline).NotEmpty()
            .WithMessage("Hạn nộp không được để trống.");
        RuleFor(x => x.MaxScore).GreaterThan(0).LessThanOrEqualTo(100);
    }
}
