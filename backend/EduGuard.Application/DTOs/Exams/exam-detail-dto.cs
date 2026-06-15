namespace EduGuard.Application.DTOs.Exams;

public class ExamDetailDto : ExamDto
{
    public List<QuestionDto> Questions { get; set; } = [];
}
