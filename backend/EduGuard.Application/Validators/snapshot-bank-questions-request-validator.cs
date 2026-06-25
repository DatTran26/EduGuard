using EduGuard.Application.DTOs.QuestionBanks;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class SnapshotBankQuestionsRequestValidator : AbstractValidator<SnapshotBankQuestionsRequest>
{
    public SnapshotBankQuestionsRequestValidator()
    {
        RuleFor(x => x.BankQuestionIds).NotEmpty();
        RuleForEach(x => x.BankQuestionIds).GreaterThan(0);
        RuleFor(x => x.StartOrderIndex).GreaterThan(0).When(x => x.StartOrderIndex.HasValue);
    }
}
