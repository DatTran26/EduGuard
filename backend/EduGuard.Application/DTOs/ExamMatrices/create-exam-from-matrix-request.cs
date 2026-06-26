using EduGuard.Application.DTOs.Exams;
using EduGuard.Domain.Enums;

namespace EduGuard.Application.DTOs.ExamMatrices;

public class CreateExamFromMatrixRequest
{
    public int QuestionBankId { get; set; }
    public int ClassroomId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool EnableAntiCheat { get; set; }
    public ExamSettingDto Settings { get; set; } = new();
    public List<CreateExamFromMatrixQuestionRequest> Questions { get; set; } = [];
}

public class CreateExamFromMatrixQuestionRequest
{
    public int MatrixItemId { get; set; }
    public int BankQuestionId { get; set; }
    public int? BankQuestionVersion { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public decimal Score { get; set; }
    public int OrderIndex { get; set; }
    public List<AnswerInputDto> Answers { get; set; } = [];
}
