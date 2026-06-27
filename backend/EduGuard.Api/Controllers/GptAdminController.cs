using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.DTOs.Settings;
using EduGuard.Application.Services.Interfaces;

namespace EduGuard.Api.Controllers;

[ApiController]
[Tags("AdminGpt")]
[Authorize(Roles = "Admin")]
public class GptAdminController : ControllerBase
{
    private readonly IGptSettingsService _gptSettingsService;
    private readonly IHttpClientFactory _httpClientFactory;

    public GptAdminController(IGptSettingsService gptSettingsService, IHttpClientFactory httpClientFactory)
    {
        _gptSettingsService = gptSettingsService;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("api/admin/gpt/settings")]
    public async Task<ActionResult<ApiResponse<GptSettingsDto>>> GetSettings(CancellationToken ct)
    {
        var dto = await _gptSettingsService.GetAdminSettingsAsync(ct);
        return Ok(ApiResponse<GptSettingsDto>.CreateSuccess(dto));
    }

    [HttpPost("api/admin/gpt/settings")]
    public async Task<ActionResult<ApiResponse<GptSettingsDto>>> SaveSettings(
        [FromBody] UpdateGptSettingsRequest request,
        CancellationToken ct)
    {
        var dto = await _gptSettingsService.UpdateAdminSettingsAsync(request, ct);
        return Ok(ApiResponse<GptSettingsDto>.CreateSuccess(dto, "Cập nhật cấu hình thành công."));
    }

    [HttpPost("api/admin/gpt/test-connection")]
    public async Task<ActionResult<ApiResponse<string>>> TestConnection(
        [FromBody] UpdateGptSettingsRequest request,
        CancellationToken ct)
    {
        var apiKey = await _gptSettingsService.ResolveApiKeyForTestAsync(request.ApiKey, ct);

        if (string.IsNullOrWhiteSpace(apiKey))
            return BadRequest(ApiResponse<string>.CreateFailure("Vui lòng cung cấp API Key."));

        var baseUrl = string.IsNullOrWhiteSpace(request.BaseUrl)
            ? "https://api.openai.com/v1"
            : request.BaseUrl;

        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl.TrimEnd('/')}/models");
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await httpClient.SendAsync(httpRequest, ct);
            if (response.IsSuccessStatusCode)
                return Ok(ApiResponse<string>.CreateSuccess("Kết nối thành công tới OpenAI API!"));

            var errorContent = await response.Content.ReadAsStringAsync(ct);
            return BadRequest(ApiResponse<string>.CreateFailure($"Lỗi kết nối ({response.StatusCode}): {errorContent}"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.CreateFailure($"Lỗi kết nối: {ex.Message}"));
        }
    }
}
