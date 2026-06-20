using EduGuard.Application.DTOs.Exams;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class SaveStudentAnswerRequestValidator : AbstractValidator<SaveStudentAnswerRequest>
{
    public SaveStudentAnswerRequestValidator()
    {
        RuleFor(x => x.QuestionId).GreaterThan(0);
    }
}
