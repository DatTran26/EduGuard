using EduGuard.Application.DTOs.Common;

namespace EduGuard.Application.DTOs.Assignments;

public class PatchAssignmentRequest
{
    public Optional<string> Title { get; set; }
    public Optional<string?> Description { get; set; }
    public Optional<DateTime> Deadline { get; set; }
    public Optional<decimal> MaxScore { get; set; }
}
