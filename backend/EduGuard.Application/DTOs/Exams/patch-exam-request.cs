using EduGuard.Application.DTOs.Common;

namespace EduGuard.Application.DTOs.Exams;

public class PatchExamRequest
{
    public Optional<string> Title { get; set; }
    public Optional<string?> Description { get; set; }
    public Optional<int> DurationMinutes { get; set; }
    public Optional<DateTime?> StartTime { get; set; }
    public Optional<DateTime?> EndTime { get; set; }
    public Optional<bool> EnableAntiCheat { get; set; }
    public Optional<PatchExamSettingDto> Settings { get; set; }
}
