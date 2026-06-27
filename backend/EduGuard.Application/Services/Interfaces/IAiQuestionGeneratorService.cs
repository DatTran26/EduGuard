using EduGuard.Application.DTOs.Exams;

namespace EduGuard.Application.Services.Interfaces;

public interface IAiQuestionGeneratorService
{
    Task<List<CreateQuestionRequest>> GenerateQuestionsAsync(string prompt, string? customApiKey, string? bankContext, CancellationToken ct);
    Task<List<CreateQuestionRequest>> AutoFillMetadataAsync(List<CreateQuestionRequest> questions, string? customApiKey, string? bankContext, CancellationToken ct);
}
