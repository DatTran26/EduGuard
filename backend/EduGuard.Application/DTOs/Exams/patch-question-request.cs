using EduGuard.Application.DTOs.Common;
using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.Exams;

public class PatchQuestionRequest
{
    public Optional<string> Content { get; set; }
    public Optional<QuestionType> QuestionType { get; set; }
    public Optional<decimal> Score { get; set; }
    public Optional<int> OrderIndex { get; set; }
}
