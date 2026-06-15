using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.Exams;

public class QuestionDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public decimal Score { get; set; }
    public int OrderIndex { get; set; }
    public List<AnswerDto> Answers { get; set; } = [];
}
