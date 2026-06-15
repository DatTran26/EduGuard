namespace EduGuard.Application.DTOs.Classrooms;

public class CreateClassroomRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
