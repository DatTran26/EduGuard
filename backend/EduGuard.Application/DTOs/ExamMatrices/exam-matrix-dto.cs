namespace EduGuard.Application.DTOs.ExamMatrices;

public class ExamMatrixDto
{
    public int Id { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? GradeLevel { get; set; }
    public int TotalQuestions { get; set; }
    public decimal TotalScore { get; set; }
    public int DurationMinutes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ExamMatrixItemDto> Items { get; set; } = [];
}
