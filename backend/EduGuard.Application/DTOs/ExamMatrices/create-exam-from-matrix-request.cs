using EduGuard.Application.DTOs.Exams;

namespace EduGuard.Application.DTOs.ExamMatrices;

public class CreateExamFromMatrixRequest
{
    public int QuestionBankId { get; set; }
    public int ClassroomId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool EnableAntiCheat { get; set; }
    public ExamSettingDto Settings { get; set; } = new();
}
