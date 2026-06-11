using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace EduGuard.Api.Authorization;

/// <summary>
/// Trả JSON envelope khi [Authorize] / policy role thất bại — thay vì 403/401 body rỗng mặc định.
/// </summary>
public sealed class ApiAuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Succeeded)
        {
            await next(context);
            return;
        }

        if (authorizeResult.Challenged)
        {
            await AuthApiResponseWriter.WriteFailureAsync(
                context,
                StatusCodes.Status401Unauthorized,
                "Bạn cần đăng nhập để truy cập tài nguyên này.");
            return;
        }

        if (authorizeResult.Forbidden)
        {
            await AuthApiResponseWriter.WriteFailureAsync(
                context,
                StatusCodes.Status403Forbidden,
                "Bạn không có quyền thực hiện thao tác này.");
            return;
        }

        await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}

public static class ApiAuthorizationExtensions
{
    public static IServiceCollection AddApiAuthorizationResponses(this IServiceCollection services)
    {
        services.AddSingleton<IAuthorizationMiddlewareResultHandler, ApiAuthorizationMiddlewareResultHandler>();
        return services;
    }
}
