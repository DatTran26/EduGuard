# Tích hợp Live Proctoring (devD/devH) ↔ Question Bank & Exam Matrix (devB)

> **Mục đích:** Tài liệu forward cho Agent/developer **devB** để triển khai Question Bank & Exam Matrix **không xung đột** với module **EduGuard Live Proctoring Control Room**.  
> **Đối tượng đọc:** AI Agent / developer trên nhánh devB.  
> **Cập nhật:** 2026-06-25  
> **Liên quan:**
> - Proctoring: `plans/monitoring_camera/EduGuard_Live_Proctoring_Control_Room_Spec.md`
> - Question Bank: `plans/question_bank_matrix/eduguard-spec-question-bank-exam-matrix.md`
> - Nhánh proctoring dự kiến: `feat/live-proctoring-control-room` (từ `devD`)

---

## 1. Tóm tắt cho DevB

Hai module **độc lập về nghiệp vụ** nhưng **dùng chung** `Exam`, `ExamSetting`, `ExamAttempt`, quyền giám sát và SignalR.

```txt
devB (Question Bank)          devD/devH (Live Proctoring)
─────────────────────         ────────────────────────────
QuestionBank                  ExamLobby + camera sớm
BankQuestion                  WebRTC live watch
ExamMatrix                    Teacher Control Room
create-exam (snapshot)        ProctoringEvidence / Pause
                              YOLO proxy + Admin AI config
         │                              │
         └──────────► Exam ◄────────────┘
                      ExamSetting
                      ExamAttempt
```

**Nguyên tắc vàng:**

1. Đề tạo từ matrix vẫn là `Exam` bình thường — proctoring gắn theo `ExamId`, không quan tâm câu hỏi từ bank hay nhập tay.
2. Mọi thay đổi schema của devB lên `Exam` / `ExamSetting` phải **additive** (thêm cột/bảng), không xóa/đổi tên cột proctoring.
3. **Không** tự implement hub giám sát / WebRTC / proctoring API — dùng hợp đồng bên dưới.
4. `TeacherId` trong codebase thực tế là **`string`** (ASP.NET Identity), **không phải `int`** như draft spec question bank.

---

## 2. Phạm vi sở hữu (ownership)

### 2.1. DevB sở hữu (tạo mới, không trùng tên)

| Entity / API | Ghi chú |
|--------------|---------|
| `QuestionBank` | Kho câu hỏi |
| `BankQuestion`, `BankAnswer` | Câu hỏi/đáp án trong kho |
| `QuestionStatistic` | Thống kê câu hỏi |
| `ExamMatrix`, `ExamMatrixItem` | Ma trận đề |
| `POST /api/exam-matrices/{id}/create-exam` | Tạo đề + snapshot |
| `POST /api/exam-matrices/{id}/generate-preview` | Preview đề |
| CRUD question bank / matrix | Theo spec devB |

### 2.2. Nhánh proctoring sở hữu (devB không tạo trùng)

| Entity / API | Ghi chú |
|--------------|---------|
| `LiveProctoringSession` | Phiên xem live WebRTC |
| `ProctoringEvidence` | Snapshot / clip |
| `ProctoringState` | Trạng thái camera/risk realtime |
| `ProctorAction` | Audit thao tác giáo viên |
| `ExamProctorAssignment` | Owner mời co-proctor |
| `ProctoringAiSettings` | Admin cấu hình YOLO |
| `GET/POST .../proctoring/*`, `.../live-proctoring/*` | Theo spec proctoring §14 |
| `GET/POST .../exams/{id}/lobby/*` | Phòng chờ trước giờ thi |
| Mở rộng `ExamMonitoringHub` | Signaling WebRTC + events proctoring |
| `ai-services/proctoring-ai-service/` | FastAPI YOLO |

### 2.3. Dùng chung — cần phối hợp

| Thành phần | DevB | Proctoring |
|------------|------|------------|
| `Exam` | Tạo từ matrix, set `TeacherId` | Đọc `StartTime`/`EndTime` cho lobby |
| `ExamSetting` | Tạo bản ghi khi create-exam | Thêm ~20 field proctoring |
| `ExamAttempt` | Không đổi flow start/submit | Thêm `PausedByProctor`, proctoring APIs |
| `EnsureCanMonitorExamAsync` | Gọi nếu cần check quyền | Mở rộng co-proctor |
| `CheatingLog` / `SuspicionScore` | Không đổi | Tái sử dụng + event mới |

---

## 3. Hợp đồng kỹ thuật bắt buộc

### 3.1. `TeacherId` — dùng `string`

Codebase EduGuard hiện tại:

```csharp
// Exam.cs
public string TeacherId { get; set; } = string.Empty;
```

**DevB Agent phải:**

- [ ] Dùng `string TeacherId` trên mọi entity mới (`QuestionBank`, `BankQuestion`, `ExamMatrix`, …).
- [ ] Lấy `TeacherId` từ JWT `ClaimTypes.NameIdentifier`, **không** nhận từ request body.
- [ ] Sửa draft spec nội bộ nếu còn ghi `int TeacherId` — đó là lỗi so với repo thực tế.

### 3.2. `ExamSetting` — migration additive

Nhánh proctoring sẽ **thêm** các cột sau vào `ExamSettings` (tên có thể khác nhẹ khi implement, devB không được drop):

```csharp
// Proctoring fields (defaults khi devB create-exam)
public string AntiCheatMode { get; set; } = "BASIC";

public bool RequireCamera { get; set; }
public bool RequireMicrophone { get; set; }

public bool EnableLiveProctoring { get; set; }
public bool EnableCameraProctoring { get; set; }
public bool EnableExternalDeviceDetection { get; set; }

public bool CaptureSnapshotOnViolation { get; set; }
public bool EnableRealtimeWarning { get; set; }

public int CameraHeartbeatIntervalSeconds { get; set; } = 10;
public int MaxCameraOffSeconds { get; set; } = 15;
public int SnapshotCooldownSeconds { get; set; } = 30;
public int MaxSnapshotsPerAttempt { get; set; } = 20;

public int MaxActiveLiveTiles { get; set; } = 9;
public string DefaultLiveQuality { get; set; } = "360p";
public string FocusedLiveQuality { get; set; } = "720p";

public bool AllowTeacherManualSnapshot { get; set; } = true;
public bool AllowTeacherManualRecording { get; set; } = false;
public bool AllowMoveToWaitingRoom { get; set; } = true;

public string ViolationAction { get; set; } = "WARN_TEACHER";
```

**DevB Agent phải:**

- [ ] Khi `create-exam` từ matrix: tạo `ExamSetting` với các field **shuffle** hiện có (`ShuffleQuestions`, `ShuffleAnswers`, `RequireFullscreen`, …) **và để default** các field proctoring ở trên (không cần UI matrix v1).
- [ ] **Không** `INSERT` thiếu `ExamSetting` nếu đề cần setting — proctoring đọc từ bảng này.
- [ ] **Không** rename/drop cột `RequireFullscreen` hoặc bất kỳ cột `ExamSettings` hiện có.
- [ ] Nếu devB thêm cột riêng (vd. `SourceMatrixId`): dùng tên **không trùng** cột proctoring; thêm migration riêng.

**Gợi ý tùy chọn (phase sau, không bắt buộc v1):**

```csharp
// Có thể thêm sau trên Exam — devB đề xuất, proctoring không phụ thuộc v1
public int? SourceExamMatrixId { get; set; }
public int? SourceQuestionBankId { get; set; }
```

### 3.3. Tạo đề từ matrix — luồng chuẩn

```txt
POST /api/exam-matrices/{id}/create-exam
  → Transaction
  → Validate matrix + question bank ownership
  → Chọn BankQuestion (Approved, đủ số lượng)
  → Create Exam (TeacherId = JWT, ClassroomId từ request/body hợp lệ)
  → Create ExamSetting (defaults proctoring = false/off)
  → Snapshot BankQuestion → Question, BankAnswer → Answer
  → Commit
  → Return examId
```

**DevB Agent phải:**

- [ ] `Exam.TeacherId` = giáo viên tạo đề (owner proctoring mặc định).
- [ ] Copy câu hỏi sang `Question`/`Answer` (**snapshot**), không reference trực tiếp `BankQuestionId` trên `Question` đang làm bài (tránh sửa bank làm đổi đề đã thi).
- [ ] Set `Exam.StartTime` / `Exam.EndTime` / `Exam.DurationMinutes` nếu matrix hoặc body có — lobby proctoring dùng `StartTime`.
- [ ] Giữ `Exam.EnableAntiCheat` độc lập với `EnableLiveProctoring` — hai flag khác nhau; create-exam có thể copy từ matrix hoặc default `EnableAntiCheat = false`.

### 3.4. Quyền giám sát — dùng service tập trung

Hiện tại (sẽ được proctoring mở rộng):

```csharp
// IExamMonitoringService.EnsureCanMonitorExamAsync
// Cho phép: Admin OR exam.TeacherId
// Sau merge proctoring thêm: OR ExamProctorAssignment
```

**DevB Agent phải:**

- [ ] **Không** copy logic “chỉ teacher owner” rải rác trong controller.
- [ ] Nếu API devB cần kiểm tra quyền xem đề/đề matrix liên quan thi: inject `IExamMonitoringService` hoặc helper exam access hiện có.
- [ ] **Không** tạo `ProctoringHub` / hub SignalR mới cho giám sát.
- [ ] Student APIs (`start`, `submit`, `answers`) — không đổi contract; proctoring bọc thêm bước lobby/device check ở FE.

### 3.5. `ExamAttempt` và trạng thái pause

Proctoring sẽ thêm:

```csharp
public enum ExamAttemptStatus
{
    InProgress = 1,
    Submitted = 2,
    PausedByProctor = 3  // Giáo viên tạm dừng thi
}
```

**DevB Agent phải:**

- [ ] `StartAsync` / `SubmitAsync` / chấm điểm: chỉ xử lý `InProgress` → `Submitted` như hiện tại.
- [ ] **Không** coi `PausedByProctor` là `Submitted`.
- [ ] Khi query “attempts đã nộp”: filter `Status == Submitted` (loại trừ pause).
- [ ] Thống kê câu hỏi (`QuestionStatistic`): chỉ cập nhật sau submit hợp lệ — attempt pause không submit.

### 3.6. SignalR

| Hub | Path | Owner |
|-----|------|-------|
| `ExamMonitoringHub` | `/hubs/exam-monitoring` | Proctoring mở rộng |

**DevB Agent phải:**

- [ ] Không đăng ký hub trùng chức năng.
- [ ] Nếu cần realtime cho matrix preview: dùng polling/REST hoặc thảo luận riêng — **không** ghi đè group `exam:{examId}`.

### 3.7. Frontend — route không chồng

| Route | Module |
|-------|--------|
| `/teacher/question-banks`, `/teacher/exam-matrices`, … | devB |
| `/teacher/exams/:examId/proctoring` | Proctoring |
| `/student/exams/:examId/lobby` | Proctoring |

**DevB Agent phải:**

- [ ] Đăng ký route question bank trong `routeConfig.js` / `AppRoutes.jsx` — namespace `question-bank`, `exam-matrix`.
- [ ] Không đặt route đè `/teacher/exams/:examId/proctoring`.
- [ ] Trang chi tiết đề (`ExamDetailPage`): có thể thêm link “Mở phòng giám sát” **sau merge** — devB không bắt buộc v1; proctoring sẽ thêm từ nhánh proctoring.

---

## 4. Checklist chi tiết cho Agent DevB

### 4.1. Trước khi code

- [ ] Đọc `plans/question_bank_matrix/eduguard-spec-question-bank-exam-matrix.md`.
- [ ] Đọc file này + `EduGuard_Live_Proctoring_Control_Room_Spec.md` (ít nhất §1, §5, §13.1, §14).
- [ ] `git pull origin devD` (hoặc `release`) định kỳ để thấy migration proctoring sớm.
- [ ] Xác nhận `TeacherId` là `string` trên toàn bộ entity mới.

### 4.2. Database & EF Core

- [ ] Migration devB chỉ thêm bảng bank/matrix — **không** alter `ExamSettings` xóa cột.
- [ ] Nếu devB cần cột mới trên `Exams`: dùng nullable / default; không đổi PK/FK `ExamId`.
- [ ] Index: tránh index trùng tên với migration proctoring (`IX_Proctoring*`, `IX_ExamProctor*`).
- [ ] Sau `create-exam`: luôn có 1 row `ExamSettings` cho `ExamId` đó.

### 4.3. `create-exam` implementation

- [ ] Transaction bao trùm Exam + ExamSetting + Questions + Answers + UsageCount.
- [ ] Validate đủ câu **trước** khi tạo Exam (theo spec devB §14).
- [ ] `ExamSetting` defaults:

```csharp
new ExamSetting
{
    ExamId = exam.Id,
    ShuffleQuestions = request.ShuffleQuestions,
    ShuffleAnswers = request.ShuffleAnswers,
    RequireFullscreen = false, // hoặc từ request nếu có
    // Các field proctoring: để default CLR/DB (false, 0, null)
    // KHÔNG cần set thủ công từng field nếu migration đã có default
};
```

- [ ] Response trả `examId` — FE proctoring chỉ cần `examId` để mở control room.

### 4.4. Authorization & ownership

- [ ] QuestionBank / ExamMatrix: `TeacherId == currentUser` hoặc Admin.
- [ ] `create-exam`: matrix + question bank phải thuộc cùng teacher (hoặc rule devB định nghĩa).
- [ ] Không cho Student gọi API bank/matrix/create-exam.

### 4.5. Tương thích anti-cheat hiện có

- [ ] `Exam.EnableAntiCheat` vẫn hoạt động độc lập — đề từ matrix có thể bật anti-cheat trong form sửa đề sau khi tạo.
- [ ] Không đổi enum `CheatingLog` event types hiện có.
- [ ] Proctoring thêm event mới (`PHONE_VISIBLE`, …) — devB không cần implement.

### 4.6. Cache Redis (nếu devB cache question bank)

Theo `Todo List.md` / Redis UC-1:

- [ ] Chỉ cache **question bank gốc** / câu hỏi đề (teacher view).
- [ ] **Không** cache dữ liệu đã shuffle theo attempt.
- [ ] Invalidate khi sửa bank — **không** invalidate key proctoring (`proctoring:*`, `exam:*:lobby:*`).

### 4.7. Swagger & API docs

- [ ] Tag Swagger: `QuestionBank`, `ExamMatrix` — tách khỏi `Proctoring`.
- [ ] Cập nhật `docs/apiList.md` — không đánh số trùng ID proctoring (thống nhất với team).

### 4.8. Changelog & Todo

- [ ] Ghi `docs/project-changelog.md` theo feature devB.
- [ ] `Todo List.md` — không tick mục proctoring/live camera.

---

## 5. Kịch bản merge Git

### 5.1. Thứ tự đề xuất

```txt
Cách A (an toàn):
  1. Merge feat/live-proctoring-control-room → devD
  2. devB rebase/merge devD → tiếp tục bank/matrix
  3. Resolve migration: giữ CẢ HAI migration, snapshot EF merge

Cách B:
  1. Merge devB → devD trước
  2. Proctoring rebase lên devD, thêm migration proctoring sau
```

### 5.2. Xử lý conflict thường gặp

| File | Cách xử lý |
|------|------------|
| `AppDbContextModelSnapshot.cs` | Giữ entity cả hai nhánh |
| `exam-setting-configuration.cs` | Merge property cả devB và proctoring |
| `ExamSetting.cs` | Union tất cả properties |
| `dependency-injection.cs` | Register service cả hai module |
| `Program.cs` | Hub + static files proctoring uploads |
| `AppRoutes.jsx` | Route cả bank và proctoring |

### 5.3. Kiểm tra sau merge (cả hai team)

```powershell
dotnet build backend\EduGuard.Api\EduGuard.Api.csproj
dotnet ef database update --project backend\EduGuard.Infrastructure --startup-project backend\EduGuard.Api
npm --prefix frontend run lint
npm --prefix frontend run build
```

**Kịch bản E2E tối thiểu:**

1. Teacher tạo matrix → `create-exam` → có `Exam` + `ExamSetting`.
2. Teacher bật `RequireCamera` + `EnableLiveProctoring` trên đề (UI proctoring).
3. Student vào lobby trước `StartTime` → camera sớm → mở đề → làm bài.
4. Teacher mở `/teacher/exams/{id}/proctoring` → thấy tile sinh viên.
5. Đề tạo thủ công (không matrix) vẫn proctoring bình thường.

---

## 6. Điều DevB không cần làm (tránh trùng effort)

- WebRTC, `useWebRtcLiveStream`, watch lock Redis.
- `ExamLobbyPage`, `StudentDeviceCheckPage`, Teacher Control Room UI.
- `ProctoringEvidence` upload, YOLO service, `ProctoringAiSettings` admin tab.
- Mở rộng `ExamMonitoringHub` signaling.
- `ExamProctorAssignment` UI/API (owner mời co-proctor) — nhánh proctoring.

---

## 7. Câu hỏi escalate về team proctoring

Nếu devB cần một trong các hạng mục sau, **dừng và hỏi** trước khi implement:

1. Thêm field bắt buộc trên `ExamSetting` khi create-exam (vd. matrix bật sẵn camera).
2. Đa owner trên `Exam` (khác `TeacherId` + `ExamProctorAssignment`).
3. Hub SignalR realtime cho tiến trình generate đề dài.
4. Lưu `BankQuestionId` trên `Question` để trace (chỉ metadata, không đọc nội dung khi làm bài).
5. Thay đổi `POST /api/exams/{id}/start` hoặc heartbeat contract.

---

## 8. Tài liệu tham chiếu nhanh

| Tài liệu | Nội dung |
|----------|----------|
| `EduGuard_Live_Proctoring_Control_Room_Spec.md` | Spec đầy đủ proctoring v1 |
| `eduguard-spec-question-bank-exam-matrix.md` | Spec bank/matrix devB |
| `AGENTS.md` | Branch policy, commit, changelog |
| `docs/07_DEVELOPMENT_RULES.md` | Quy trình dev |
| `backend/.../exam-monitoring-service.cs` | Quyền monitor exam |

---

## 9. Tóm tắt một dòng cho Agent DevB

> **Tạo bank/matrix và snapshot sang Exam như spec; dùng `string TeacherId`; luôn tạo `ExamSetting` với default proctoring; không đụng hub/WebRTC/proctoring entities; merge additive; gọi `EnsureCanMonitorExamAsync` thay vì tự check owner.**
