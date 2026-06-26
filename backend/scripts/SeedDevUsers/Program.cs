using EduGuard.Domain.Entities;
using EduGuard.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

const string DefaultPassword = "Test@12345";

var seedUsers = new (string Email, string FullName, string Role)[]
{
    ("admin@eduguard.test", "Admin EduGuard", "Admin"),
    ("teacher1@eduguard.test", "Giao Vien Mot", "Teacher"),
    ("teacher2@eduguard.test", "Giao Vien Hai", "Teacher"),
    ("student1@eduguard.test", "Sinh Vien Mot", "Student"),
    ("student2@eduguard.test", "Sinh Vien Hai", "Student"),
    ("student3@eduguard.test", "Sinh Vien Ba", "Student"),
};

var apiDirectory = FindApiDirectory();
Console.WriteLine($"Using API config: {apiDirectory}");

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration
    .SetBasePath(apiDirectory)
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
    .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: false)
    .AddEnvironmentVariables();

builder.Services.AddInfrastructure(builder.Configuration);

using var host = builder.Build();
using var scope = host.Services.CreateScope();
var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

foreach (var roleName in new[] { "Admin", "Teacher", "Student" })
{
    if (!await roleManager.RoleExistsAsync(roleName))
    {
        var result = await roleManager.CreateAsync(new IdentityRole(roleName));
        if (!result.Succeeded)
            throw new InvalidOperationException($"Cannot create role {roleName}: {string.Join("; ", result.Errors.Select(e => e.Description))}");
    }
}

foreach (var (email, fullName, role) in seedUsers)
{
    var normalizedEmail = email.Trim().ToLowerInvariant();
    var user = await userManager.FindByEmailAsync(normalizedEmail);

    if (user is null)
    {
        user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            FullName = fullName,
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        var createResult = await userManager.CreateAsync(user, DefaultPassword);
        if (!createResult.Succeeded)
            throw new InvalidOperationException($"Cannot create {email}: {string.Join("; ", createResult.Errors.Select(e => e.Description))}");

        Console.WriteLine($"Created user: {email}");
    }
    else
    {
        user.FullName = fullName;
        user.IsActive = true;
        user.EmailConfirmed = true;
        await userManager.UpdateAsync(user);
        Console.WriteLine($"User exists, updated profile: {email}");
    }

    if (!await userManager.IsInRoleAsync(user, role))
    {
        var roleResult = await userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
            throw new InvalidOperationException($"Cannot assign {role} to {email}: {string.Join("; ", roleResult.Errors.Select(e => e.Description))}");

        Console.WriteLine($"  Assigned role: {role}");
    }
    else
    {
        Console.WriteLine($"  Role already assigned: {role}");
    }
}

Console.WriteLine();
Console.WriteLine("Seed complete. All accounts use password: Test@12345");
Console.WriteLine();
foreach (var (email, fullName, role) in seedUsers)
    Console.WriteLine($"  [{role,-7}] {email} — {fullName}");

static string FindApiDirectory()
{
    var dir = AppContext.BaseDirectory;
    while (!string.IsNullOrEmpty(dir))
    {
        var direct = Path.Combine(dir, "appsettings.json");
        if (File.Exists(direct) && dir.EndsWith("EduGuard.Api", StringComparison.OrdinalIgnoreCase))
            return dir;

        var nested = Path.Combine(dir, "EduGuard.Api", "appsettings.json");
        if (File.Exists(nested))
            return Path.Combine(dir, "EduGuard.Api");

        dir = Directory.GetParent(dir)?.FullName ?? string.Empty;
    }

    throw new InvalidOperationException("Could not find EduGuard.Api/appsettings.json. Run from repo with backend/EduGuard.Api configured.");
}
