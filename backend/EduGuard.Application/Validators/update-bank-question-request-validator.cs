using EduGuard.Application.DTOs.QuestionBanks;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class UpdateBankQuestionRequestValidator : AbstractValidator<UpdateBankQuestionRequest>
{
    public UpdateBankQuestionRequestValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.QuestionType).IsInEnum();
        RuleFor(x => x.Difficulty).IsInEnum();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.DefaultScore).GreaterThan(0);
        RuleFor(x => x.Subject).MaximumLength(150);
        RuleFor(x => x.Chapter).MaximumLength(200);
        RuleFor(x => x.Lesson).MaximumLength(200);
        RuleFor(x => x.LearningOutcome).MaximumLength(300);
    }
}
