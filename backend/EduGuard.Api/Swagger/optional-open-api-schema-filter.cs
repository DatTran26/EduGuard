using EduGuard.Application.DTOs.Common;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace EduGuard.Api.Swagger;

/// <summary>
/// Swagger hiển thị Optional&lt;T&gt; như T (field PATCH thường), không lộ isSpecified/value.
/// </summary>
public sealed class OptionalOpenApiSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (!IsOptionalType(context.Type, out var innerType))
            return;

        var innerSchema = context.SchemaGenerator.GenerateSchema(innerType, context.SchemaRepository);

        schema.Reference = innerSchema.Reference;
        schema.Type = innerSchema.Type;
        schema.Format = innerSchema.Format;
        schema.Nullable = innerSchema.Nullable;
        schema.Properties = innerSchema.Properties;
        schema.Items = innerSchema.Items;
        schema.Enum = innerSchema.Enum;
        schema.AllOf = innerSchema.AllOf;
        schema.OneOf = innerSchema.OneOf;
        schema.AnyOf = innerSchema.AnyOf;
        schema.AdditionalProperties = innerSchema.AdditionalProperties;
        schema.Description = innerSchema.Description;
        schema.Example = innerSchema.Example;
        schema.Default = innerSchema.Default;
    }

    private static bool IsOptionalType(Type type, out Type innerType)
    {
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Optional<>))
        {
            innerType = type.GetGenericArguments()[0];
            return true;
        }

        innerType = typeof(object);
        return false;
    }
}
