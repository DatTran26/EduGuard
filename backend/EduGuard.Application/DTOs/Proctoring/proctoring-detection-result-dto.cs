namespace EduGuard.Application.DTOs.Proctoring;

public class ProctoringDetectionResultDto
{
    public string DetectionType { get; set; } = string.Empty;
    public decimal Confidence { get; set; }
    public bool IsFlagged { get; set; }
    public string? Message { get; set; }
    public IReadOnlyList<string> Labels { get; set; } = [];
}
