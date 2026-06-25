namespace EduGuard.Application.Options;

public class ProctoringOptions
{
    public const string SectionName = "Proctoring";

    public string EvidenceUploadRoot { get; set; } = "wwwroot/uploads/proctoring";
    public long MaxEvidenceFileBytes { get; set; } = 10 * 1024 * 1024;
}
