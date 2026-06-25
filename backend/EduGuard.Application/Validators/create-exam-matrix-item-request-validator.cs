using EduGuard.Application.DTOs.ExamMatrices;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class CreateExamMatrixItemRequestValidator : AbstractValidator<CreateExamMatrixItemRequest>
{
    public CreateExamMatrixItemRequestValidator()
    {
        RuleFor(x => x.Chapter).MaximumLength(200);
        RuleFor(x => x.Lesson).MaximumLength(200);
        RuleFor(x => x.LearningOutcome).MaximumLength(300);
        RuleFor(x => x.QuestionType).IsInEnum().When(x => x.QuestionType.HasValue);
        RuleFor(x => x.Difficulty).IsInEnum();
        RuleFor(x => x.QuestionCount).GreaterThan(0);
        RuleFor(x => x.ScorePerQuestion).GreaterThan(0);
    }
}
