using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGuard.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionBanksAndExamMatrices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BankQuestionId",
                table: "Questions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BankQuestionVersion",
                table: "Questions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ExamMatrices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeacherId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    GradeLevel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    TotalQuestions = table.Column<int>(type: "int", nullable: false),
                    TotalScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamMatrices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExamMatrices_Users_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBanks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeacherId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Subject = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    GradeLevel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBanks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionBanks_Users_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExamMatrixItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExamMatrixId = table.Column<int>(type: "int", nullable: false),
                    Chapter = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Lesson = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    LearningOutcome = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    QuestionType = table.Column<int>(type: "int", nullable: true),
                    Difficulty = table.Column<int>(type: "int", nullable: false),
                    QuestionCount = table.Column<int>(type: "int", nullable: false),
                    ScorePerQuestion = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamMatrixItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExamMatrixItems_ExamMatrices_ExamMatrixId",
                        column: x => x.ExamMatrixId,
                        principalTable: "ExamMatrices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BankQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionBankId = table.Column<int>(type: "int", nullable: false),
                    TeacherId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    QuestionType = table.Column<int>(type: "int", nullable: false),
                    Difficulty = table.Column<int>(type: "int", nullable: false),
                    DefaultScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Chapter = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Lesson = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    LearningOutcome = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    ParentQuestionId = table.Column<int>(type: "int", nullable: true),
                    TimesUsed = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankQuestions_BankQuestions_ParentQuestionId",
                        column: x => x.ParentQuestionId,
                        principalTable: "BankQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BankQuestions_QuestionBanks_QuestionBankId",
                        column: x => x.QuestionBankId,
                        principalTable: "QuestionBanks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BankQuestions_Users_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BankAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BankQuestionId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankAnswers_BankQuestions_BankQuestionId",
                        column: x => x.BankQuestionId,
                        principalTable: "BankQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Questions_BankQuestionId",
                table: "Questions",
                column: "BankQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_BankAnswers_BankQuestionId",
                table: "BankAnswers",
                column: "BankQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_BankQuestions_ParentQuestionId",
                table: "BankQuestions",
                column: "ParentQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_BankQuestions_QuestionBankId_Status_Difficulty",
                table: "BankQuestions",
                columns: new[] { "QuestionBankId", "Status", "Difficulty" });

            migrationBuilder.CreateIndex(
                name: "IX_BankQuestions_TeacherId_QuestionType",
                table: "BankQuestions",
                columns: new[] { "TeacherId", "QuestionType" });

            migrationBuilder.CreateIndex(
                name: "IX_ExamMatrices_TeacherId_Name",
                table: "ExamMatrices",
                columns: new[] { "TeacherId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_ExamMatrixItems_ExamMatrixId",
                table: "ExamMatrixItems",
                column: "ExamMatrixId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBanks_TeacherId_Name",
                table: "QuestionBanks",
                columns: new[] { "TeacherId", "Name" });

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_BankQuestions_BankQuestionId",
                table: "Questions",
                column: "BankQuestionId",
                principalTable: "BankQuestions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Questions_BankQuestions_BankQuestionId",
                table: "Questions");

            migrationBuilder.DropTable(
                name: "BankAnswers");

            migrationBuilder.DropTable(
                name: "ExamMatrixItems");

            migrationBuilder.DropTable(
                name: "BankQuestions");

            migrationBuilder.DropTable(
                name: "ExamMatrices");

            migrationBuilder.DropTable(
                name: "QuestionBanks");

            migrationBuilder.DropIndex(
                name: "IX_Questions_BankQuestionId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "BankQuestionId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "BankQuestionVersion",
                table: "Questions");
        }
    }
}
