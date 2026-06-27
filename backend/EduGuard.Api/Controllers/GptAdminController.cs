using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using EduGuard.Infrastructure.Common;
using EduGuard.Application.DTOs.Common;

namespace EduGuard.Api.Controllers;

[ApiController]
[Tags("AdminGpt")]
[Authorize(Roles = "Admin")]
public class GptAdminController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public GptAdminController(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("api/admin/gpt/settings")]
    public ActionResult<ApiResponse<GptSettingsDto>> GetSettings()
    {
        var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? _configuration["OpenAI:ApiKey"] ?? "";
        var model = Environment.GetEnvironmentVariable("OPENAI_MODEL") ?? _configuration["OpenAI:Model"] ?? "gpt-5.4";
        var baseUrl = Environment.GetEnvironmentVariable("OPENAI_BASE_URL") ?? _configuration["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1";
        
        var maskedKey = string.Empty;
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            maskedKey = apiKey.Length > 8 
                ? $"{apiKey[..4]}...{apiKey[^4..]}" 
                : "sk-proj-...";
        }

        var dto = new GptSettingsDto
        {
            ApiKey = maskedKey,
            Model = model,
            BaseUrl = baseUrl
        };

        return Ok(ApiResponse<GptSettingsDto>.CreateSuccess(dto));
    }

    [HttpPost("api/admin/gpt/settings")]
    public ActionResult<ApiResponse<string>> SaveSettings([FromBody] GptSettingsDto request)
    {
        var currentApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? _configuration["OpenAI:ApiKey"] ?? "";
        var newApiKey = request.ApiKey ?? "";

        if (newApiKey.Contains("...") || string.IsNullOrWhiteSpace(newApiKey))
        {
            newApiKey = currentApiKey;
        }

        var values = new Dictionary<string, string>
        {
            { "OPENAI_API_KEY", newApiKey },
            { "OPENAI_MODEL", request.Model ?? "gpt-5.4" },
            { "OPENAI_BASE_URL", request.BaseUrl ?? "https://api.openai.com/v1" }
        };

        EnvFileHelper.SaveEnv(values);

        return Ok(ApiResponse<string>.CreateSuccess("Cập nhật cấu hình thành công."));
    }

    [HttpPost("api/admin/gpt/test-connection")]
    public async Task<ActionResult<ApiResponse<string>>> TestConnection([FromBody] GptSettingsDto request, CancellationToken ct)
    {
        var currentApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? _configuration["OpenAI:ApiKey"] ?? "";
        var apiKey = request.ApiKey ?? "";

        if (apiKey.Contains("...") || string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = currentApiKey;
        }

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return BadRequest(ApiResponse<string>.CreateFailure("Vui lòng cung cấp API Key."));
        }

        var baseUrl = request.BaseUrl ?? "https://api.openai.com/v1";

        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl.TrimEnd('/')}/models");
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await httpClient.SendAsync(httpRequest, ct);
            if (response.IsSuccessStatusCode)
            {
                return Ok(ApiResponse<string>.CreateSuccess("Kết nối thành công tới OpenAI API!"));
            }

            var errorContent = await response.Content.ReadAsStringAsync(ct);
            return BadRequest(ApiResponse<string>.CreateFailure($"Lỗi kết nối ({response.StatusCode}): {errorContent}"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.CreateFailure($"Lỗi kết nối: {ex.Message}"));
        }
    }
}

public class GptSettingsDto
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
}

