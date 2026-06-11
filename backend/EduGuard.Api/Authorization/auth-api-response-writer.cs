using EduGuard.Application.DTOs.Common;

namespace EduGuard.Api.Authorization;

internal static class AuthApiResponseWriter
{
    public static Task WriteFailureAsync(HttpContext context, int statusCode, string message)
    {
        if (context.Response.HasStarted)
            return Task.CompletedTask;

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        return context.Response.WriteAsJsonAsync(ApiResponse<object>.CreateFailure(message));
    }
}
