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
        RuleFor(x => x.StartTime)
            .NotNull()
            .When(x => x.IsPublished)
            .WithMessage("Vui lòng chọn thời gian mở đề.");
        RuleFor(x => x.Settings).NotNull();
        RuleFor(x => x.Questions)
            .NotEmpty()
            .WithMessage("Vui lòng xác nhận đề nháp trước khi tạo bài kiểm tra thật.");
        RuleForEach(x => x.Questions).ChildRules(question =>
        {
            question.RuleFor(x => x.MatrixItemId).GreaterThan(0);
            question.RuleFor(x => x.BankQuestionId).GreaterThan(0);
            question.RuleFor(x => x.Content).NotEmpty().MaximumLength(2000);
            question.RuleFor(x => x.QuestionType).IsInEnum();
            question.RuleFor(x => x.Score).GreaterThan(0);
            question.RuleFor(x => x.OrderIndex).GreaterThan(0);
            question.RuleFor(x => x.Answers).NotNull();
        });
        When(x => x.Settings is not null, () =>
        {
            RuleFor(x => x.Settings.MaxAttempts).GreaterThan(0);
        });

        RuleFor(x => x)
            .Must(HasValidTimeWindow)
            .WithMessage("Thời gian đóng đề phải sau thời gian mở đề.");
    }

    private static bool HasValidTimeWindow(CreateExamFromMatrixRequest request) =>
        !request.StartTime.HasValue ||
        !request.EndTime.HasValue ||
        NormalizeUtc(request.EndTime.Value) > NormalizeUtc(request.StartTime.Value);

    private static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
