namespace EduGuard.Application.DTOs.Exams;

public class QuestionImportResultDto
{
    public string FileName { get; set; } = string.Empty;
    public int TotalRows { get; set; }
    public int ImportedCount { get; set; }
    public int FailedCount { get; set; }
    public List<QuestionDto> Questions { get; set; } = [];
    public List<QuestionImportErrorDto> Errors { get; set; } = [];
}
