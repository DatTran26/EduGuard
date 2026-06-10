using EduGuard.Application.DTOs.Classrooms;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class JoinClassroomRequestValidator : AbstractValidator<JoinClassroomRequest>
{
    public JoinClassroomRequestValidator()
    {
        RuleFor(x => x.JoinCode).NotEmpty().MaximumLength(20);
    }
}
