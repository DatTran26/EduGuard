using EduGuard.Application.DTOs.QuestionBanks;

namespace EduGuard.Application.DTOs.ExamMatrices;

public class ExamMatrixPreviewDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TotalQuestions { get; set; }
    public decimal TotalScore { get; set; }
    public List<ExamMatrixValidationIssueDto> Errors { get; set; } = [];
    public List<ExamMatrixPreviewQuestionDto> Questions { get; set; } = [];
}

public class ExamMatrixPreviewQuestionDto
{
    public int MatrixItemId { get; set; }
    public decimal Score { get; set; }
    public BankQuestionDto Question { get; set; } = new();
}
