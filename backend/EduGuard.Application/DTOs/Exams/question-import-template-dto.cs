namespace EduGuard.Application.DTOs.Exams;

public class QuestionImportTemplateDto
{
    public string FileName { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string DownloadUrl { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}
