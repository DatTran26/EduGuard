namespace EduGuard.Domain.Entities;

public class QuestionBank
{
    public int Id { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Subject { get; set; }
    public string? GradeLevel { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ApplicationUser Teacher { get; set; } = null!;
    public ICollection<BankQuestion> Questions { get; set; } = [];
}
