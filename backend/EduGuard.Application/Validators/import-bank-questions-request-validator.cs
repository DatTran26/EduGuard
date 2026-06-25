using EduGuard.Application.DTOs.QuestionBanks;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class ImportBankQuestionsRequestValidator : AbstractValidator<ImportBankQuestionsRequest>
{
    public ImportBankQuestionsRequestValidator()
    {
        RuleFor(x => x.Difficulty).IsInEnum();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Subject).MaximumLength(150);
        RuleFor(x => x.Chapter).MaximumLength(200);
        RuleFor(x => x.Lesson).MaximumLength(200);
        RuleFor(x => x.LearningOutcome).MaximumLength(300);
    }
}
