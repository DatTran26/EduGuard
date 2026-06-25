using EduGuard.Application.DTOs.QuestionBanks;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class CreateQuestionBankRequestValidator : AbstractValidator<CreateQuestionBankRequest>
{
    public CreateQuestionBankRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.Subject).MaximumLength(150);
        RuleFor(x => x.GradeLevel).MaximumLength(50);
    }
}
