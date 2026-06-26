using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace EduGuard.Infrastructure.QuestionBanks;

public class OpenAiQuestionGeneratorService : IAiQuestionGeneratorService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public OpenAiQuestionGeneratorService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<List<CreateQuestionRequest>> GenerateQuestionsAsync(string prompt, string? customApiKey, CancellationToken ct)
    {
        var apiKey = !string.IsNullOrWhiteSpace(customApiKey) 
            ? customApiKey 
            : _configuration["OpenAI:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("OpenAI API Key is not configured. Please supply an API key in settings or configuration.");
        }

        var model = _configuration["OpenAI:Model"] ?? "gpt-5.5";
        var baseUrl = _configuration["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1";

        var payload = new
        {
            model = model,
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            response_format = new
            {
                type = "json_schema",
                json_schema = new
                {
                    name = "generate_questions",
                    strict = true,
                    schema = new
                    {
                        type = "object",
                        properties = new
                        {
                            questions = new
                            {
                                type = "array",
                                items = new
                                {
                                    type = "object",
                                    properties = new
                                    {
                                        content = new { type = "string" },
                                        questionType = new { type = "string", @enum = new[] { "SingleChoice", "MultipleChoice", "TrueFalse", "ShortAnswer" } },
                                        difficulty = new { type = "string", @enum = new[] { "Easy", "Medium", "Hard" } },
                                        defaultScore = new { type = "number" },
                                        answers = new
                                        {
                                            type = "array",
                                            items = new
                                            {
                                                type = "object",
                                                properties = new
                                                {
                                                    content = new { type = "string" },
                                                    isCorrect = new { type = "boolean" }
                                                },
                                                required = new[] { "content", "isCorrect" },
                                                additionalProperties = false
                                            }
                                        }
                                    },
                                    required = new[] { "content", "questionType", "difficulty", "defaultScore", "answers" },
                                    additionalProperties = false
                                }
                            }
                        },
                        required = new[] { "questions" },
                        additionalProperties = false
                    }
                }
            },
            reasoning_effort = "medium"
        };

        var requestJson = JsonSerializer.Serialize(payload);
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl.TrimEnd('/')}/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"OpenAI API call failed with status {response.StatusCode}: {errorContent}");
        }

        var responseJson = await response.Content.ReadAsStringAsync(ct);
        var openAiResponse = JsonSerializer.Deserialize<OpenAiResponse>(responseJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        var generatedContent = openAiResponse?.Choices?.FirstOrDefault()?.Message?.Content;
        if (string.IsNullOrWhiteSpace(generatedContent))
        {
            throw new InvalidOperationException("Received empty content from OpenAI response choices.");
        }

        var generatedList = JsonSerializer.Deserialize<GeneratedQuestionList>(generatedContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (generatedList?.Questions == null)
        {
            throw new InvalidOperationException("Failed to parse questions array from OpenAI response content.");
        }

        var result = new List<CreateQuestionRequest>();
        var orderIndex = 1;

        foreach (var genQ in generatedList.Questions)
        {
            if (!Enum.TryParse<QuestionType>(genQ.QuestionType, true, out var qType))
            {
                qType = QuestionType.SingleChoice;
            }

            var answerDtos = genQ.Answers.Select((a, idx) => new AnswerInputDto
            {
                Content = a.Content,
                IsCorrect = a.IsCorrect,
                OrderIndex = idx + 1
            }).ToList();

            result.Add(new CreateQuestionRequest
            {
                Content = genQ.Content,
                QuestionType = qType,
                Score = genQ.DefaultScore,
                OrderIndex = orderIndex++,
                Difficulty = genQ.Difficulty,
                Answers = answerDtos
            });
        }

        return result;
    }

    private class OpenAiChoice
    {
        public OpenAiMessage? Message { get; set; }
    }

    private class OpenAiMessage
    {
        public string? Content { get; set; }
    }

    private class OpenAiResponse
    {
        public List<OpenAiChoice>? Choices { get; set; }
    }

    private class GeneratedQuestionList
    {
        public List<GeneratedQuestion>? Questions { get; set; }
    }

    private class GeneratedQuestion
    {
        public string Content { get; set; } = string.Empty;
        public string QuestionType { get; set; } = "SingleChoice";
        public string Difficulty { get; set; } = "Medium";
        public decimal DefaultScore { get; set; } = 1.0m;
        public List<GeneratedAnswer> Answers { get; set; } = [];
    }

    private class GeneratedAnswer
    {
        public string Content { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }
}
