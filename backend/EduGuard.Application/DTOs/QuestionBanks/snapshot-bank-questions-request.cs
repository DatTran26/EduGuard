namespace EduGuard.Application.DTOs.QuestionBanks;

public class SnapshotBankQuestionsRequest
{
    public List<int> BankQuestionIds { get; set; } = [];
    public int? StartOrderIndex { get; set; }
}
