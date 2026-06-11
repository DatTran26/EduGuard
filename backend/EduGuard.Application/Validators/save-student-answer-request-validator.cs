using EduGuard.Application.DTOs.Exams;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class SaveStudentAnswerRequestValidator : AbstractValidator<SaveStudentAnswerRequest>
{
    public SaveStudentAnswerRequestValidator()
    {
        RuleFor(x => x.QuestionId).GreaterThan(0);
        RuleFor(x => x)
            .Must(x => x.AnswerIds.Count > 0 || !string.IsNullOrWhiteSpace(x.TextAnswer))
            .WithMessage("Cần chọn đáp án hoặc nhập câu trả lời.");
    }
}
