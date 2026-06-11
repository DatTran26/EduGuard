using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.Exams;

public class UpdateQuestionRequest
{
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public decimal Score { get; set; }
    public int OrderIndex { get; set; }
    public List<AnswerInputDto> Answers { get; set; } = [];
}
