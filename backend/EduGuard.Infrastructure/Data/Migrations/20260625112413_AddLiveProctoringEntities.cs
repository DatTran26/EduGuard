using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGuard.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveProctoringEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowMoveToWaitingRoom",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowTeacherManualRecording",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowTeacherManualSnapshot",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "AntiCheatMode",
                table: "ExamSettings",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "BASIC");

            migrationBuilder.AddColumn<int>(
                name: "CameraHeartbeatIntervalSeconds",
                table: "ExamSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "CaptureSnapshotOnViolation",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "DefaultLiveQuality",
                table: "ExamSettings",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "360p");

            migrationBuilder.AddColumn<bool>(
                name: "EnableCameraProctoring",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableExternalDeviceDetection",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableLiveProctoring",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableRealtimeWarning",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FocusedLiveQuality",
                table: "ExamSettings",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "720p");

            migrationBuilder.AddColumn<int>(
                name: "MaxActiveLiveTiles",
                table: "ExamSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxCameraOffSeconds",
                table: "ExamSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxSnapshotsPerAttempt",
                table: "ExamSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "RequireCamera",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RequireMicrophone",
                table: "ExamSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SnapshotCooldownSeconds",
                table: "ExamSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ViolationAction",
                table: "ExamSettings",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "WARN_TEACHER");

            migrationBuilder.CreateTable(
                name: "ExamProctorAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExamId = table.Column<int>(type: "int", nullable: false),
                    TeacherId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    InvitedByTeacherId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamProctorAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExamProctorAssignments_Exams_ExamId",
                        column: x => x.ExamId,
                        principalTable: "Exams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LiveProctoringSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExamId = table.Column<int>(type: "int", nullable: false),
                    ExamAttemptId = table.Column<int>(type: "int", nullable: false),
                    TeacherId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    StudentId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConnectedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Metadata = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiveProctoringSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiveProctoringSessions_ExamAttempts_ExamAttemptId",
                        column: x => x.ExamAttemptId,
                        principalTable: "ExamAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LiveProctoringSessions_Exams_ExamId",
                        column: x => x.ExamId,
                        principalTable: "Exams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProctorActions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExamAttemptId = table.Column<int>(type: "int", nullable: false),
                    TeacherId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Metadata = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProctorActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProctorActions_ExamAttempts_ExamAttemptId",
                        column: x => x.ExamAttemptId,
                        principalTable: "ExamAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProctoringAiSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EnableYoloDetection = table.Column<bool>(type: "bit", nullable: false),
                    AiServiceBaseUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PhoneVisibleMinConfidence = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BookVisibleMinConfidence = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SecondPersonMinConfidence = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DetectionIntervalSeconds = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProctoringAiSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProctoringEvidences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExamAttemptId = table.Column<int>(type: "int", nullable: false),
                    CheatingLogId = table.Column<int>(type: "int", nullable: true),
                    EvidenceType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CaptureSource = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    TriggerEventType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    TriggeredByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    Confidence = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CapturedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Metadata = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProctoringEvidences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProctoringEvidences_CheatingLogs_CheatingLogId",
                        column: x => x.CheatingLogId,
                        principalTable: "CheatingLogs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProctoringEvidences_ExamAttempts_ExamAttemptId",
                        column: x => x.ExamAttemptId,
                        principalTable: "ExamAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProctoringStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExamAttemptId = table.Column<int>(type: "int", nullable: false),
                    CameraStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    LiveStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    FullscreenStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    ConnectionStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    EnvironmentStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    LatestDetectionType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    WarningCount = table.Column<int>(type: "int", nullable: false),
                    EvidenceCount = table.Column<int>(type: "int", nullable: false),
                    SuspicionScore = table.Column<int>(type: "int", nullable: false),
                    RiskLevel = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    LastHeartbeatAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LatestWarningAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProctoringStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProctoringStates_ExamAttempts_ExamAttemptId",
                        column: x => x.ExamAttemptId,
                        principalTable: "ExamAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ProctoringAiSettings",
                columns: new[] { "Id", "AiServiceBaseUrl", "BookVisibleMinConfidence", "DetectionIntervalSeconds", "EnableYoloDetection", "PhoneVisibleMinConfidence", "SecondPersonMinConfidence", "UpdatedAt" },
                values: new object[] { 1, "http://127.0.0.1:8800", 0.60m, 4, true, 0.65m, 0.65m, new DateTime(2026, 6, 25, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.CreateIndex(
                name: "IX_ExamProctorAssignments_ExamId_TeacherId",
                table: "ExamProctorAssignments",
                columns: new[] { "ExamId", "TeacherId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LiveProctoringSessions_ExamAttemptId_Status",
                table: "LiveProctoringSessions",
                columns: new[] { "ExamAttemptId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_LiveProctoringSessions_ExamId",
                table: "LiveProctoringSessions",
                column: "ExamId");

            migrationBuilder.CreateIndex(
                name: "IX_LiveProctoringSessions_TeacherId",
                table: "LiveProctoringSessions",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_ProctorActions_ExamAttemptId",
                table: "ProctorActions",
                column: "ExamAttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_ProctoringEvidences_CheatingLogId",
                table: "ProctoringEvidences",
                column: "CheatingLogId");

            migrationBuilder.CreateIndex(
                name: "IX_ProctoringEvidences_ExamAttemptId",
                table: "ProctoringEvidences",
                column: "ExamAttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_ProctoringStates_ExamAttemptId",
                table: "ProctoringStates",
                column: "ExamAttemptId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExamProctorAssignments");

            migrationBuilder.DropTable(
                name: "LiveProctoringSessions");

            migrationBuilder.DropTable(
                name: "ProctorActions");

            migrationBuilder.DropTable(
                name: "ProctoringAiSettings");

            migrationBuilder.DropTable(
                name: "ProctoringEvidences");

            migrationBuilder.DropTable(
                name: "ProctoringStates");

            migrationBuilder.DropColumn(
                name: "AllowMoveToWaitingRoom",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "AllowTeacherManualRecording",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "AllowTeacherManualSnapshot",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "AntiCheatMode",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "CameraHeartbeatIntervalSeconds",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "CaptureSnapshotOnViolation",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "DefaultLiveQuality",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "EnableCameraProctoring",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "EnableExternalDeviceDetection",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "EnableLiveProctoring",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "EnableRealtimeWarning",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "FocusedLiveQuality",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "MaxActiveLiveTiles",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "MaxCameraOffSeconds",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "MaxSnapshotsPerAttempt",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "RequireCamera",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "RequireMicrophone",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "SnapshotCooldownSeconds",
                table: "ExamSettings");

            migrationBuilder.DropColumn(
                name: "ViolationAction",
                table: "ExamSettings");
        }
    }
}
