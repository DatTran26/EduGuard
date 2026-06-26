using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGuard.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ExtendNotificationMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActionUrl",
                table: "Notifications",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RelatedExamAttemptId",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RelatedExamId",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceKey",
                table: "Notifications",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_SourceKey_CreatedAt",
                table: "Notifications",
                columns: new[] { "SourceKey", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notifications_SourceKey_CreatedAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "ActionUrl",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RelatedExamAttemptId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RelatedExamId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "SourceKey",
                table: "Notifications");
        }
    }
}
