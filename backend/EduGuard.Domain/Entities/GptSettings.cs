namespace EduGuard.Domain.Entities;

public class GptSettings
{
    public int Id { get; set; } = 1;
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gpt-5.4";
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
