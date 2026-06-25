namespace EduGuard.Domain.Entities;

public class ExamMatrix
{
    public int Id { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? GradeLevel { get; set; }
    public int TotalQuestions { get; set; }
    public decimal TotalScore { get; set; }
    public int DurationMinutes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ApplicationUser Teacher { get; set; } = null!;
    public ICollection<ExamMatrixItem> Items { get; set; } = [];
}
