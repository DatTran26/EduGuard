using EduGuard.Application.DTOs.Exams;

namespace EduGuard.Application.DTOs.QuestionBanks;

public class BankQuestionImportResultDto
{
    public string FileName { get; set; } = string.Empty;
    public int TotalRows { get; set; }
    public int ImportedCount { get; set; }
    public int FailedCount { get; set; }
    public List<BankQuestionDto> Questions { get; set; } = [];
    public List<QuestionImportErrorDto> Errors { get; set; } = [];
}
