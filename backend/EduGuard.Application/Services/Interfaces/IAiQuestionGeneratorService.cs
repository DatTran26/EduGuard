using EduGuard.Application.DTOs.Exams;

namespace EduGuard.Application.Services.Interfaces;

public interface IAiQuestionGeneratorService
{
    Task<List<CreateQuestionRequest>> GenerateQuestionsAsync(string prompt, string? customApiKey, CancellationToken ct);
}
