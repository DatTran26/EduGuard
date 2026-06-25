namespace EduGuard.Domain.Entities;

public class ProctoringAiSettings
{
    public int Id { get; set; } = 1;
    public bool EnableYoloDetection { get; set; } = true;
    public string AiServiceBaseUrl { get; set; } = "http://127.0.0.1:8800";
    public decimal PhoneVisibleMinConfidence { get; set; } = 0.65m;
    public decimal BookVisibleMinConfidence { get; set; } = 0.60m;
    public decimal SecondPersonMinConfidence { get; set; } = 0.65m;
    public int DetectionIntervalSeconds { get; set; } = 4;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
