using EduGuard.Application.DTOs.ExamMatrices;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class CreateExamFromMatrixRequestValidator : AbstractValidator<CreateExamFromMatrixRequest>
{
    public CreateExamFromMatrixRequestValidator()
    {
        RuleFor(x => x.QuestionBankId).GreaterThan(0);
        RuleFor(x => x.ClassroomId).GreaterThan(0);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Settings).NotNull();
        When(x => x.Settings is not null, () =>
        {
            RuleFor(x => x.Settings.MaxAttempts).GreaterThan(0);
        });
    }
}
