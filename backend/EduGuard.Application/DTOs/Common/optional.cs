using System.Text.Json.Serialization;

namespace EduGuard.Application.DTOs.Common;

/// <summary>
/// Giá trị optional cho PATCH: IsSpecified=false khi field không có trong JSON body.
/// </summary>
[JsonConverter(typeof(OptionalJsonConverterFactory))]
public readonly struct Optional<T>
{
    [JsonIgnore]
    public bool IsSpecified { get; init; }

    [JsonIgnore]
    public T? Value { get; init; }

    public Optional(T? value)
    {
        IsSpecified = true;
        Value = value;
    }
}
