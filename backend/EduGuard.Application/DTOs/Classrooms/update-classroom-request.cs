namespace EduGuard.Application.DTOs.Classrooms;

public class UpdateClassroomRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
