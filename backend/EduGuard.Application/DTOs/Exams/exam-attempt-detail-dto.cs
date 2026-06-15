namespace EduGuard.Application.DTOs.Exams;

public class ExamAttemptDetailDto : ExamAttemptDto
{
    public List<QuestionDto> Questions { get; set; } = [];
    public List<StudentAnswerDto> SavedAnswers { get; set; } = [];
}
