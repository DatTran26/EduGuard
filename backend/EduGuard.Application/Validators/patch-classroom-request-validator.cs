using EduGuard.Application.DTOs.Classrooms;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class PatchClassroomRequestValidator : AbstractValidator<PatchClassroomRequest>
{
    public PatchClassroomRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.Name.IsSpecified || x.Description.IsSpecified)
            .WithMessage("Phải có ít nhất một trường để cập nhật.");

        When(x => x.Name.IsSpecified, () =>
        {
            RuleFor(x => x.Name.Value)
                .NotEmpty().WithMessage("Tên lớp không được để trống.")
                .MaximumLength(200);
        });

        When(x => x.Description.IsSpecified, () =>
        {
            RuleFor(x => x.Description.Value)
                .MaximumLength(1000);
        });
    }
}
