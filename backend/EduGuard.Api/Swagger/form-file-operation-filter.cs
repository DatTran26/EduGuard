using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace EduGuard.Api.Swagger;

/// <summary>
/// Documents multipart/form-data file upload for actions that read Request.Form.Files directly.
/// </summary>
public sealed class FormFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var consumesMultipart = context.MethodInfo.GetCustomAttributes(true)
            .OfType<Microsoft.AspNetCore.Mvc.ConsumesAttribute>()
            .Any(attr => attr.ContentTypes.Any(t => t.Contains("multipart/form-data", StringComparison.OrdinalIgnoreCase)));

        if (!consumesMultipart)
            return;

        operation.RequestBody = new OpenApiRequestBody
        {
            Content =
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties =
                        {
                            ["file"] = new OpenApiSchema { Type = "string", Format = "binary" }
                        },
                        Required = new HashSet<string> { "file" }
                    }
                }
            }
        };
    }
}
