namespace EduGuard.Application.DTOs.ExamMatrices;

public class ExamMatrixValidationResultDto
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TotalQuestions { get; set; }
    public decimal TotalScore { get; set; }
    public List<ExamMatrixValidationIssueDto> Items { get; set; } = [];
    public List<ExamMatrixValidationIssueDto> Errors { get; set; } = [];
}
