using EduGuard.Application.DTOs.ExamMatrices;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class UpdateExamMatrixRequestValidator : AbstractValidator<UpdateExamMatrixRequest>
{
    public UpdateExamMatrixRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Subject).MaximumLength(150);
        RuleFor(x => x.GradeLevel).MaximumLength(50);
        RuleFor(x => x.TotalQuestions).GreaterThan(0);
        RuleFor(x => x.TotalScore).GreaterThan(0);
        RuleFor(x => x.DurationMinutes).GreaterThan(0);
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).SetValidator(new CreateExamMatrixItemRequestValidator());
    }
}
