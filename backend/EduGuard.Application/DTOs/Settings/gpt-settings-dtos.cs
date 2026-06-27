namespace EduGuard.Application.DTOs.Settings;

public class GptSettingsDto
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
}

public class UpdateGptSettingsRequest
{
    public string? ApiKey { get; set; }
    public string Model { get; set; } = "gpt-5.4";
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
}
