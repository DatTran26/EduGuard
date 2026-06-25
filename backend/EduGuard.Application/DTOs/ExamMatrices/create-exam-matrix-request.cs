namespace EduGuard.Application.DTOs.ExamMatrices;

public class CreateExamMatrixRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? GradeLevel { get; set; }
    public int TotalQuestions { get; set; }
    public decimal TotalScore { get; set; }
    public int DurationMinutes { get; set; }
    public List<CreateExamMatrixItemRequest> Items { get; set; } = [];
}
