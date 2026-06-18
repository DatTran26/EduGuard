namespace EduGuard.Application.DTOs.Exams;

public class QuestionImportErrorDto
{
    public int RowNumber { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}
