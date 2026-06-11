using EduGuard.Application.DTOs.Exams;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class CreateQuestionRequestValidator : AbstractValidator<CreateQuestionRequest>
{
    public CreateQuestionRequestValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Score).GreaterThan(0);
        RuleFor(x => x.OrderIndex).GreaterThan(0);
        RuleFor(x => x.QuestionType).IsInEnum();
    }
}
