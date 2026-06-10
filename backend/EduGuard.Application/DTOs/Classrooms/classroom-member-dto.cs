namespace EduGuard.Application.DTOs.Classrooms;

public class ClassroomMemberDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}
