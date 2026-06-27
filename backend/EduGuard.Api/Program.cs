using EduGuard.Api.Authorization;
using EduGuard.Api.Hubs;
using EduGuard.Api.Realtime;
using EduGuard.Api.Swagger;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Application.Validators;
using EduGuard.Infrastructure;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using EduGuard.Infrastructure.Common;

EnvFileHelper.LoadEnv();
var builder = WebApplication.CreateBuilder(args);

var jwtKey = builder.Configuration["Jwt:Key"];
if (!builder.Environment.IsDevelopment()
    && (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Contains("DEMO", StringComparison.OrdinalIgnoreCase)))
{
    throw new InvalidOperationException(
        "Jwt:Key must be configured via environment or user secrets for non-Development environments.");
}

// Avoid the Windows EventLog provider breaking local API requests when the
// current user cannot write to the .NET Runtime event log source.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new OptionalJsonConverterFactory());
    });
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiAuthorizationResponses();
builder.Services.AddSignalR();
builder.Services.AddScoped<IExamMonitoringNotifier, SignalRExamMonitoringNotifier>();
builder.Services.AddScoped<INotificationNotifier, SignalRNotificationNotifier>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SchemaFilter<OptionalOpenApiSchemaFilter>();
    options.OperationFilter<FormFileOperationFilter>();
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://127.0.0.1:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("FrontendPolicy");

app.UseWhen(
    context => !context.Request.Path.StartsWithSegments("/uploads/proctoring"),
    branch => branch.UseStaticFiles());

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ExamMonitoringHub>("/hubs/exam-monitoring");

app.Run();
