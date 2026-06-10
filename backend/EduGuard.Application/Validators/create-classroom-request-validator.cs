using EduGuard.Application.DTOs.Classrooms;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class CreateClassroomRequestValidator : AbstractValidator<CreateClassroomRequest>
{
    public CreateClassroomRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
    }
}
