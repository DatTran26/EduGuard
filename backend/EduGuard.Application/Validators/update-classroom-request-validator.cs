using EduGuard.Application.DTOs.Classrooms;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class UpdateClassroomRequestValidator : AbstractValidator<UpdateClassroomRequest>
{
    public UpdateClassroomRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên lớp không được để trống.")
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .MaximumLength(1000);
    }
}
