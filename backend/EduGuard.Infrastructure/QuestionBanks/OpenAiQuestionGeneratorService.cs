using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Enums;

namespace EduGuard.Infrastructure.QuestionBanks;

public class OpenAiQuestionGeneratorService : IAiQuestionGeneratorService
{
    private readonly HttpClient _httpClient;
    private readonly IGptSettingsService _gptSettingsService;

    public OpenAiQuestionGeneratorService(
        HttpClient httpClient,
        IGptSettingsService gptSettingsService)
    {
        _httpClient = httpClient;
        _gptSettingsService = gptSettingsService;
    }

    public async Task<List<CreateQuestionRequest>> GenerateQuestionsAsync(string prompt, string? customApiKey, string? bankContext, CancellationToken ct)
    {
        var runtime = await _gptSettingsService.GetRuntimeSettingsAsync(ct);
        var apiKey = !string.IsNullOrWhiteSpace(customApiKey) ? customApiKey : runtime.ApiKey;

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("OpenAI API Key is not configured. Please supply an API key in settings or configuration.");
        }

        var model = runtime.Model;
        var baseUrl = runtime.BaseUrl;

        var payload = new
        {
            model = model,
            messages = new[]
            {
                new { 
                    role = "system", 
                    content = "Bạn là một trợ lý AI tạo câu hỏi kiểm tra chuyên nghiệp. Hãy tạo các câu hỏi dựa trên yêu cầu từ người dùng. Đối với mỗi câu hỏi, hãy tự phân tích nội dung để xác định và điền thông tin môn học (subject), chương học (chapter) và bài học (lesson) tương ứng một cách hợp lý nhất dựa trên ngữ cảnh môn học được cung cấp. Nếu ngữ cảnh môn học bị thiếu hoặc không rõ, hãy tự suy luận môn học và chủ đề phù hợp nhất từ nội dung câu hỏi. ĐẶC BIỆT LƯU Ý: Đối với trường thông tin chương học (chapter), bạn CHỈ ĐƯỢC PHÉP điền số của chương dưới dạng chữ số đơn thuần (ví dụ: \"1\", \"2\", \"3\", \"4\", \"5\", \"6\",...) tương ứng với chương chứa bài học đó (ví dụ: nếu câu hỏi thuộc bài học CSS hay bài học CSS cơ bản nằm ở chương 1, hãy điền chapter là \"1\"; tuyệt đối không điền chữ kiểu \"Chương 1\" hay \"Chương: 1\")." 
                },
                new { 
                    role = "user", 
                    content = $"Ngữ cảnh ngân hàng câu hỏi hiện tại: {bankContext}\n\nYêu cầu tạo câu hỏi:\n{prompt}" 
                }
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
                                        subject = new { type = "string" },
                                        chapter = new { type = "string" },
                                        lesson = new { type = "string" },
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
                                    required = new[] { "content", "questionType", "difficulty", "defaultScore", "subject", "chapter", "lesson", "answers" },
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
                Subject = genQ.Subject,
                Chapter = ExtractChapterNumber(genQ.Chapter),
                Lesson = genQ.Lesson,
                Answers = answerDtos
            });
        }

        return result;
    }

    public async Task<List<CreateQuestionRequest>> AutoFillMetadataAsync(List<CreateQuestionRequest> questions, string? customApiKey, string? bankContext, CancellationToken ct)
    {
        if (questions == null || questions.Count == 0)
            return [];

        var missingIndices = new List<int>();
        var missingData = new List<object>();

        for (int i = 0; i < questions.Count; i++)
        {
            var q = questions[i];
            if (string.IsNullOrWhiteSpace(q.Subject) || string.IsNullOrWhiteSpace(q.Chapter) || string.IsNullOrWhiteSpace(q.Lesson))
            {
                missingIndices.Add(i);
                missingData.Add(new
                {
                    index = i,
                    content = q.Content,
                    subject = q.Subject ?? "",
                    chapter = q.Chapter ?? "",
                    lesson = q.Lesson ?? ""
                });
            }
        }

        if (missingIndices.Count == 0)
            return questions;

        var runtime = await _gptSettingsService.GetRuntimeSettingsAsync(ct);
        var apiKey = !string.IsNullOrWhiteSpace(customApiKey) ? customApiKey : runtime.ApiKey;

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("OpenAI API Key is not configured. Please supply an API key in settings or configuration.");
        }

        var model = runtime.Model;
        var baseUrl = runtime.BaseUrl;

        var payload = new
        {
            model = model,
            messages = new[]
            {
                new { 
                    role = "system", 
                    content = "Bạn là một trợ lý AI phân tích nội dung câu hỏi học thuật. Đối với mỗi câu hỏi được cung cấp, hãy tự phân tích nội dung để xác định và điền thông tin môn học (subject), chương học (chapter) và bài học (lesson) tương ứng một cách hợp lý nhất. Dựa vào ngữ cảnh môn học/ngân hàng câu hỏi được cung cấp (nếu có). Nếu trường thông tin nào đã có sẵn (không rỗng), hãy giữ nguyên. Nếu bị thiếu hoặc rỗng, hãy tự suy luận ra giá trị phù hợp nhất dựa trên nội dung câu hỏi. ĐẶC BIỆT LƯU Ý: Đối với trường thông tin chương học (chapter), bạn CHỈ ĐƯỢC PHÉP điền số của chương dưới dạng chữ số đơn thuần (ví dụ: \"1\", \"2\", \"3\", \"4\", \"5\", \"6\",...) tương ứng với chương chứa bài học đó (ví dụ: nếu câu hỏi thuộc bài học CSS hay bài học CSS cơ bản nằm ở chương 1, hãy điền chapter là \"1\"; tuyệt đối không điền chữ kiểu \"Chương 1\" hay \"Chương: 1\"). Trả về đúng danh sách các câu hỏi tương ứng với thứ tự đầu vào." 
                },
                new { 
                    role = "user", 
                    content = $"Ngữ cảnh ngân hàng câu hỏi hiện tại: {bankContext}\n\nDanh sách câu hỏi cần bổ sung thông tin:\n{JsonSerializer.Serialize(missingData)}" 
                }
            },
            response_format = new
            {
                type = "json_schema",
                json_schema = new
                {
                    name = "autofill_questions",
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
                                        index = new { type = "integer" },
                                        subject = new { type = "string" },
                                        chapter = new { type = "string" },
                                        lesson = new { type = "string" }
                                    },
                                    required = new[] { "index", "subject", "chapter", "lesson" },
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

        var filledList = JsonSerializer.Deserialize<AutoFillResponseList>(generatedContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (filledList?.Questions != null)
        {
            for (int k = 0; k < filledList.Questions.Count; k++)
            {
                var filledQ = filledList.Questions[k];
                CreateQuestionRequest? target = null;

                // Try 0-based index first
                if (filledQ.Index >= 0 && filledQ.Index < questions.Count)
                {
                    target = questions[filledQ.Index];
                }
                // Try 1-based index
                else if (filledQ.Index - 1 >= 0 && filledQ.Index - 1 < questions.Count)
                {
                    target = questions[filledQ.Index - 1];
                }

                // If index match fails, fallback to the sequential index of the missing items list
                if (target == null && k < missingIndices.Count)
                {
                    var origIdx = missingIndices[k];
                    if (origIdx >= 0 && origIdx < questions.Count)
                    {
                        target = questions[origIdx];
                    }
                }

                if (target != null)
                {
                    if (string.IsNullOrWhiteSpace(target.Subject) && !string.IsNullOrWhiteSpace(filledQ.Subject))
                        target.Subject = filledQ.Subject.Trim();
                    if (string.IsNullOrWhiteSpace(target.Chapter) && !string.IsNullOrWhiteSpace(filledQ.Chapter))
                        target.Chapter = ExtractChapterNumber(filledQ.Chapter.Trim());
                    if (string.IsNullOrWhiteSpace(target.Lesson) && !string.IsNullOrWhiteSpace(filledQ.Lesson))
                        target.Lesson = filledQ.Lesson.Trim();
                }
            }
        }

        return questions;
    }

    private class AutoFillResponseList
    {
        public List<AutoFillResponseQuestion>? Questions { get; set; }
    }

    private class AutoFillResponseQuestion
    {
        public int Index { get; set; }
        public string? Subject { get; set; }
        public string? Chapter { get; set; }
        public string? Lesson { get; set; }
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
        public string? Subject { get; set; }
        public string? Chapter { get; set; }
        public string? Lesson { get; set; }
        public List<GeneratedAnswer> Answers { get; set; } = [];
    }

    private class GeneratedAnswer
    {
        public string Content { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }
    private static string? ExtractChapterNumber(string? chapter)
    {
        if (string.IsNullOrWhiteSpace(chapter))
            return null;

        var trimmed = chapter.Trim();
        var digits = new string(trimmed.Where(char.IsDigit).ToArray());
        return !string.IsNullOrEmpty(digits) ? digits : trimmed;
    }
}
