using EduGuard.Application.DTOs.Common;

namespace EduGuard.Application.DTOs.Classrooms;

public class PatchClassroomRequest
{
    public Optional<string> Name { get; set; }
    public Optional<string?> Description { get; set; }
}
