using EduGuard.Application.DTOs.Exams;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class UpdateAnswerRequestValidator : AbstractValidator<UpdateAnswerRequest>
{
    public UpdateAnswerRequestValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.OrderIndex).GreaterThan(0);
    }
}
