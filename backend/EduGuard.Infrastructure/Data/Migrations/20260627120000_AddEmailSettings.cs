using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGuard.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmailSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Enabled = table.Column<bool>(type: "bit", nullable: false),
                    Host = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Port = table.Column<int>(type: "int", nullable: false),
                    UseSsl = table.Column<bool>(type: "bit", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Password = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FromAddress = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    FromName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    RequireOnRegister = table.Column<bool>(type: "bit", nullable: false),
                    OtpLength = table.Column<int>(type: "int", nullable: false),
                    OtpExpiryMinutes = table.Column<int>(type: "int", nullable: false),
                    ResendCooldownSeconds = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailSettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "EmailSettings",
                columns: new[]
                {
                    "Id", "Enabled", "Host", "Port", "UseSsl", "Username", "Password",
                    "FromAddress", "FromName", "RequireOnRegister", "OtpLength",
                    "OtpExpiryMinutes", "ResendCooldownSeconds", "UpdatedAt"
                },
                values: new object[]
                {
                    1, false, "smtp.gmail.com", 587, true, "", "",
                    "noreply@eduguard.local", "EduGuard", true, 6, 10, 60,
                    new DateTime(2026, 6, 27, 0, 0, 0, 0, DateTimeKind.Utc)
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailSettings");
        }
    }
}
