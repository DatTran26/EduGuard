namespace EduGuard.Domain.Entities;

public class BankAnswer
{
    public int Id { get; set; }
    public int BankQuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }

    public BankQuestion BankQuestion { get; set; } = null!;
}
