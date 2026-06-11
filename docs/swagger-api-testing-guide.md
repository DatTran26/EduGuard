# Hướng dẫn test API trên Swagger

> **Mục đích:** Hướng dẫn từng bước test backend EduGuard qua Swagger UI — từ đăng nhập JWT đến luồng Classroom → Assignment → Exam → Attempt.  
> **Liên quan:** [`apiList.md`](apiList.md) · [`05_API_FRONTEND_INTEGRATION.md`](05_API_FRONTEND_INTEGRATION.md) · [`02_SETUP_AND_PROJECT_STRUCTURE.md`](02_SETUP_AND_PROJECT_STRUCTURE.md)  
> **Cập nhật:** 2026-06-11 · Backend Phase 2–6

---

## 1. Điều kiện trước khi test

| Yêu cầu | Ghi chú |
|-----------|---------|
| .NET 8 SDK | `dotnet --version` |
| SQL Server | Connection string trong `backend/EduGuard.Api/appsettings.json` |
| Database | `EduGuardExam` đã có migration (xem §2) |
| Môi trường | `ASPNETCORE_ENVIRONMENT=Development` (Swagger chỉ bật ở Development) |

### 1.1. Chuẩn bị database

Từ thư mục `backend/`:

```powershell
dotnet ef database update --project EduGuard.Infrastructure --startup-project EduGuard.Api
```

Nếu thiếu migration mới nhất, chạy thêm:

```powershell
dotnet ef migrations add <TenMigration> --project EduGuard.Infrastructure --startup-project EduGuard.Api
dotnet ef database update --project EduGuard.Infrastructure --startup-project EduGuard.Api
```

### 1.2. Chạy API

```powershell
cd backend
dotnet run --project EduGuard.Api --launch-profile https
```

Hoặc F5 trong Visual Studio với startup project `EduGuard.Api`.

| Profile | Swagger URL |
|---------|-------------|
| **HTTPS** (khuyến nghị) | `https://localhost:7168/swagger` |
| HTTP | `http://localhost:5157/swagger` |

> Port lấy từ `backend/EduGuard.Api/Properties/launchSettings.json`. Nếu máy bạn khác port, mở file đó để kiểm tra.

---

## 2. Giao diện Swagger & envelope response

### 2.1. Cấu trúc response chuẩn

Hầu hết endpoint trả về:

```json
{
  "success": true,
  "message": "Thành công.",
  "data": { }
}
```

Lỗi:

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "data": null
}
```

**403 khi sai role** (ví dụ Student gọi `PUT /api/classrooms/{id}`):

```json
{
  "success": false,
  "message": "Bạn không có quyền thực hiện thao tác này.",
  "data": null
}
```

**401 khi thiếu / hết hạn token:**

```json
{
  "success": false,
  "message": "Bạn cần đăng nhập để truy cập tài nguyên này.",
  "data": null
}
```

> Áp dụng **toàn cục** cho mọi endpoint có `[Authorize]` / `[Authorize(Roles = "...")]` — không chỉ Classroom.

### PUT vs PATCH

| Method | Khi nào dùng |
|--------|----------------|
| **PUT** | Gửi **đầy đủ** trạng thái resource. Field không gửi có thể bị ghi đè (vd. `description` null → xóa mô tả). |
| **PATCH** | Chỉ gửi field **cần đổi** — field không có trong body **giữ nguyên**. |

Chỉ đổi tên lớp (giữ mô tả) — body **phẳng**, không dùng `isSpecified` / `value`:

```http
PATCH /api/classrooms/{id}
Content-Type: application/json

{"name": "Technology Medium"}
```

**Không** gửi dạng `{"name": {"isSpecified": true, "value": "..."}}` — đó là schema Swagger cũ; sau khi restart API, Swagger hiển thị đúng dạng phẳng.

Xóa mô tả bằng PATCH: `"description": null` hoặc `""`. Không gửi `name` với chuỗi rỗng `""` nếu muốn đổi tên (validator báo lỗi).

PATCH có sẵn: Classroom, Assignment, Exam, Question, Answer (Teacher).

HTTP status thường gặp:

| Status | Ý nghĩa |
|--------|---------|
| 200 | Thành công |
| 400 | Validation / business rule (đọc `message`) |
| 401 | Chưa đăng nhập hoặc token hết hạn — body JSON `success: false` |
| 403 | Đã đăng nhập nhưng sai role / không có quyền — body JSON `success: false` |
| 404 | Không tìm thấy resource |

### 2.2. Đọc kết quả trên Swagger

1. Bấm **Try it out** → điền body (nếu có) → **Execute**.
2. Xem **Response body** và **Code**.
3. Ghi lại các ID trong `data` (`classroomId`, `examId`, `attemptId`, …) để dùng cho bước sau.

---

## 3. Đăng nhập JWT trên Swagger

### 3.1. Tạo tài khoản test

`POST /api/auth/register` — **không cần** Authorize.

```json
{
  "fullName": "Giao Vien Test",
  "email": "teacher@test.local",
  "password": "Test@12345"
}
```

Mật khẩu tối thiểu 8 ký tự (theo validator Identity).

**Lưu ý:** Đăng ký mặc định gán role **Student**. Để test API Teacher (tạo lớp, đề thi, bài tập), cần gán thêm role Teacher — xem §3.3.

Tạo thêm một student:

```json
{
  "fullName": "Hoc Sinh Test",
  "email": "student@test.local",
  "password": "Test@12345"
}
```

### 3.2. Đăng nhập và gắn token

1. `POST /api/auth/login`:

```json
{
  "email": "teacher@test.local",
  "password": "Test@12345"
}
```

2. Trong response, copy `data.accessToken` (chuỗi JWT dài, **không** copy cả object).
3. Bấm nút **Authorize** (ổ khóa) góc phải Swagger.
4. Nhập:

```txt
Bearer <dán_accessToken_vào_đây>
```

Ví dụ: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

5. Bấm **Authorize** → **Close**.

Các request có biểu tượng ổ khóa sẽ tự gửi header `Authorization`.

### 3.3. Gán role Teacher (bắt buộc cho luồng giáo viên)

Chạy trên SQL Server (database `EduGuardExam`):

```sql
-- Kiểm tra user và role
SELECT u.Id, u.Email FROM Users u WHERE u.Email = N'teacher@test.local';
SELECT r.Id, r.Name FROM Roles r;

-- Gán role Teacher (chạy sau khi đã register)
INSERT INTO UserRoles (UserId, RoleId)
SELECT u.Id, r.Id
FROM Users u
CROSS JOIN Roles r
WHERE u.Email = N'teacher@test.local'
  AND r.Name = N'Teacher'
  AND NOT EXISTS (
    SELECT 1 FROM UserRoles ur
    WHERE ur.UserId = u.Id AND ur.RoleId = r.Id
  );
```

Sau khi gán role: **đăng nhập lại** (`POST /api/auth/login`) và **Authorize lại** token mới (JWT chứa claim role).

### 3.4. Kiểm tra token & role

| Endpoint | Kỳ vọng |
|----------|---------|
| `GET /api/auth/me` | `data.roles` chứa `Teacher` hoặc `Student` |
| `GET /api/test/teacher-only` | Teacher → 200; Student → 403 |

### 3.5. Refresh / logout (tùy chọn)

- `POST /api/auth/refresh-token` — body: `{ "refreshToken": "..." }` từ login.
- `POST /api/auth/logout` — cần Bearer + body refresh token.

---

## 4. Luồng test theo giai đoạn

Thực hiện **theo thứ tự**. Mỗi bước dùng ID từ response trước.

**Biến gợi ý** (thay bằng giá trị thật của bạn):

| Biến | Mô tả |
|------|--------|
| `{classroomId}` | ID lớp vừa tạo |
| `{joinCode}` | Mã tham gia lớp |
| `{assignmentId}` | ID bài tập |
| `{submissionId}` | ID bài nộp |
| `{examId}` | ID đề thi |
| `{questionId}` | ID câu hỏi |
| `{answerId}` | ID đáp án |
| `{attemptId}` | ID lượt thi |

---

### 4.1. Auth (Phase 2)

| Bước | Method | Path | Auth | Ghi chú |
|------|--------|------|------|---------|
| 1 | POST | `/api/auth/register` | Không | Tạo user |
| 2 | POST | `/api/auth/login` | Không | Lấy token |
| 3 | GET | `/api/auth/me` | Bearer | Profile + roles |
| 4 | GET | `/api/test` | Không | Smoke test |
| 5 | GET | `/api/test/teacher-only` | Bearer Teacher | Kiểm tra policy |

---

### 4.2. Classroom (Phase 3)

**Teacher token** cho create/update/delete; **Student token** cho join.

| Bước | Method | Path | Body mẫu |
|------|--------|------|----------|
| 1 | POST | `/api/classrooms` | `{"name":"Lớp 10A1","description":"Toán học"}` |
| 2 | GET | `/api/classrooms` | — |
| 3 | GET | `/api/classrooms/{classroomId}` | — |
| 4a | PATCH | `/api/classrooms/{classroomId}` | `{"name":"Lớp 10A1 (sửa)"}` — chỉ đổi tên |
| 4b | PUT | `/api/classrooms/{classroomId}` | `{"name":"Lớp 10A1 (sửa)","description":"..."}` — thay thế đầy đủ |
| 5 | GET | `/api/classrooms/{classroomId}/members` | — (Teacher) |
| 6 | POST | `/api/classrooms/join` | `{"joinCode":"{joinCode}"}` — **đổi sang Student token** |
| 7 | DELETE | `/api/classrooms/{classroomId}/members/{studentId}` | — (Teacher, `studentId` từ members) |

**Kỳ vọng:** Student join thành công → `members` có thêm học sinh.

---

### 4.3. Assignment (Phase 4)

| Bước | Method | Path | Role | Body mẫu |
|------|--------|------|------|----------|
| 1 | POST | `/api/classrooms/{classroomId}/assignments` | Teacher | Xem bên dưới |
| 2 | GET | `/api/classrooms/{classroomId}/assignments` | All | — |
| 3 | GET | `/api/assignments/{assignmentId}` | All | — |
| 4 | PUT | `/api/assignments/{assignmentId}` | Teacher | Sửa title/deadline |
| 5 | POST | `/api/assignments/{assignmentId}/submit` | Student | `{"content":"Bài làm của em..."}` |
| 6 | GET | `/api/assignments/{assignmentId}/submissions` | Teacher | — |
| 7 | POST | `/api/submissions/{submissionId}/grade` | Teacher | `{"score":8.5,"feedback":"Tốt"}` |
| 8 | DELETE | `/api/assignments/{assignmentId}` | Teacher | (test cuối, nếu cần) |

**Tạo bài tập:**

```json
{
  "title": "Bài tập chương 1",
  "description": "Làm bài 1-5",
  "deadline": "2026-12-31T23:59:59Z",
  "maxScore": 10
}
```

**Lưu ý:** Mỗi student chỉ nộp **một lần** / assignment (unique index).

---

### 4.4. Exam (Phase 5)

| Bước | Method | Path | Role | Ghi chú |
|------|--------|------|------|---------|
| 1 | POST | `/api/classrooms/{classroomId}/exams` | Teacher | Tạo đề + settings |
| 2 | GET | `/api/classrooms/{classroomId}/exams` | All | Student chỉ thấy đề **published** |
| 3 | GET | `/api/exams/{examId}` | All | Chi tiết metadata |
| 4 | POST | `/api/exams/{examId}/questions` | Teacher | Thêm câu hỏi + đáp án |
| 5 | GET | `/api/exams/{examId}/questions` | Teacher | Question bank (có `isCorrect`) |
| 6 | POST | `/api/exams/{examId}/publish` | Teacher | Cần ≥ 1 câu hỏi |
| 7 | PUT | `/api/exams/{examId}` | Teacher | Sửa metadata (tùy chọn) |
| 8 | PUT | `/api/questions/{questionId}` | Teacher | Sửa câu (tùy chọn) |
| 9 | POST | `/api/questions/{questionId}/answers` | Teacher | Thêm đáp án (tùy chọn) |

**Tạo đề thi:**

```json
{
  "title": "Kiểm tra 15 phút",
  "description": "Chương 1",
  "durationMinutes": 15,
  "startTime": null,
  "endTime": null,
  "enableAntiCheat": false,
  "settings": {
    "shuffleQuestions": true,
    "shuffleAnswers": true,
    "maxAttempts": 3,
    "showResultAfterSubmit": true,
    "requireFullscreen": false
  }
}
```

**Thêm câu hỏi trắc nghiệm 1 đáp án** (`questionType`: 1 = SingleChoice, 2 = MultipleChoice, 3 = TrueFalse, 4 = ShortAnswer):

```json
{
  "content": "2 + 2 = ?",
  "questionType": 1,
  "score": 2,
  "orderIndex": 1,
  "answers": [
    { "content": "3", "isCorrect": false, "orderIndex": 1 },
    { "content": "4", "isCorrect": true, "orderIndex": 2 },
    { "content": "5", "isCorrect": false, "orderIndex": 3 }
  ]
}
```

**Publish:** `POST /api/exams/{examId}/publish` — body rỗng `{}`.

---

### 4.5. Exam Attempt (Phase 6)

Dùng **Student token**, student đã join lớp, đề đã **published**.

| Bước | Method | Path | Ghi chú |
|------|--------|------|---------|
| 1 | POST | `/api/exams/{examId}/start` | Trả `attemptId` + danh sách câu (đã shuffle, **không** lộ đáp án đúng) |
| 2 | GET | `/api/attempts/{attemptId}` | Trạng thái lượt thi |
| 3 | POST | `/api/attempts/{attemptId}/answers` | Lưu từng câu |
| 4 | POST | `/api/attempts/{attemptId}/submit` | Chấm tự động + điểm |
| 5 | GET | `/api/attempts/{attemptId}/result` | Kết quả (nếu `showResultAfterSubmit`) |
| 6 | GET | `/api/exams/{examId}/attempts` | **Teacher** — danh sách lượt thi |

**Lưu đáp án** (trắc nghiệm):

```json
{
  "questionId": 1,
  "answerIds": [2],
  "textAnswer": null
}
```

**Short answer:**

```json
{
  "questionId": 2,
  "answerIds": [],
  "textAnswer": "Hà Nội"
}
```

**Submit:** `POST /api/attempts/{attemptId}/submit` — body `{}`.

**Hành vi đáng chú ý:**

- Gọi `start` lần 2 khi đang **InProgress** → trả lại attempt cũ (resume).
- Vượt `maxAttempts` → 400.
- Đề chưa publish / ngoài khung `startTime`–`endTime` → 400.

---

### 4.6. Anti-cheat (Phase 7)

Đề thi cần `enableAntiCheat: true` khi tạo/cập nhật exam. Student đang **InProgress** mới ghi log.

| Bước | Method | Path | Token | Ghi chú |
|------|--------|------|-------|---------|
| 1 | POST | `/api/anti-cheat/logs` | Student | Ghi hành vi bất thường |
| 2 | GET | `/api/anti-cheat/attempts/{attemptId}/logs` | Teacher | Danh sách log |
| 3 | GET | `/api/anti-cheat/attempts/{attemptId}/score` | Teacher | `suspicionScore` + `logCount` |
| 4 | GET | `/api/anti-cheat/exams/{examId}/summary` | Teacher | Tổng hợp theo đề |

**Body ghi log:**

```json
{
  "examAttemptId": 1,
  "type": "TAB_SWITCH",
  "description": "Học sinh chuyển tab",
  "metadata": "{\"tabCount\":2}"
}
```

**Loại `type` hợp lệ:** `TAB_SWITCH`, `WINDOW_BLUR`, `COPY_PASTE`, `EXIT_FULLSCREEN`, `PAGE_RELOAD`, `DISCONNECTED`, `WEBCAM_OFF`.

**Điểm nghi ngờ mặc định:** TAB_SWITCH 5 · WINDOW_BLUR 4 · COPY_PASTE 10 · EXIT_FULLSCREEN 8 · PAGE_RELOAD 6 · DISCONNECTED 5 · WEBCAM_OFF 15.

**Hành vi đáng chú ý:**

- Exam tắt anti-cheat → 400.
- Attempt không thuộc student / không InProgress → 403/400.
- Teacher khác người tạo đề → 403 (trừ Admin).

---

## 5. Kịch bản E2E đầy đủ (checklist)

Dùng khi verify release hoặc sau migration mới.

```
[ ] DB update thành công
[ ] API chạy, Swagger mở được
[ ] Register teacher + student
[ ] Gán role Teacher (SQL), login lại teacher
[ ] Teacher: POST classroom → lưu classroomId, joinCode
[ ] Student: POST join
[ ] Teacher: POST assignment → Student submit → Teacher grade
[ ] Teacher: POST exam → POST question → POST publish
[ ] Student: POST start → POST answers → POST submit → GET result
[ ] Teacher: GET exam attempts
[ ] Student: POST anti-cheat log (exam bật anti-cheat, attempt InProgress)
[ ] Teacher: GET anti-cheat logs + score + exam summary
[ ] Đổi token Student → gọi API Teacher → 403 (kiểm tra authorization)
```

Đối chiếu từng endpoint với tick list trong [`apiList.md`](apiList.md).

---

## 6. Xử lý lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| Swagger 404 | Không phải Development | Set `ASPNETCORE_ENVIRONMENT=Development` |
| 401 mọi API | Chưa Authorize / token hết hạn | Login lại, Authorize `Bearer ...` |
| 403 tạo lớp/đề | User chỉ có role Student | Gán Teacher (§3.3), login lại; response có `message` tiếng Việt |
| 403 body rỗng | API cũ / chưa restart server | Restart API sau khi cập nhật handler auth |
| 403 join lớp | Dùng token Teacher | Đổi sang Student |
| 400 publish | Chưa có câu hỏi | POST question trước |
| 400 submit assignment | Đã nộp rồi | Dùng assignment mới hoặc student khác |
| SSL certificate | HTTPS local | Chấp nhận cert dev hoặc dùng profile `http` |
| Connection DB fail | Sai connection string | Sửa `appsettings.json` / `appsettings.Development.json` |

### Đổi user nhanh trên Swagger

Swagger UI chỉ giữ **một** token tại một thời điểm:

1. Login user mới → copy `accessToken`.
2. **Authorize** → dán token mới (ghi chú bên ngoài đang test Teacher hay Student).

Hoặc mở Swagger ở hai tab trình duyệt / hai profile (ít dùng hơn).

---

## 7. Lệnh hữu ích (PowerShell)

```powershell
# Build
cd D:\Projects\EduGuard\backend
dotnet build

# Chạy API (HTTPS + Swagger)
dotnet run --project EduGuard.Api --launch-profile https

# Xem migration đã apply
dotnet ef migrations list --project EduGuard.Infrastructure --startup-project EduGuard.Api
```

---

## 8. Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [`apiList.md`](apiList.md) | Danh sách 57 endpoint + tick tiến độ |
| [`05_API_FRONTEND_INTEGRATION.md`](05_API_FRONTEND_INTEGRATION.md) | Axios, JWT, luồng FE |
| [`02_SETUP_AND_PROJECT_STRUCTURE.md`](02_SETUP_AND_PROJECT_STRUCTURE.md) | Cài đặt solution, CORS |
| [`07_DEVELOPMENT_RULES.md`](07_DEVELOPMENT_RULES.md) | Quy tắc: test Swagger trước khi làm UI |

---

## Unresolved questions

- Chưa có API gán role Teacher (chỉ SQL thủ công hoặc seed user trong tương lai).
- Chưa có SignalR push cảnh báo realtime (Phase 8) — anti-cheat chỉ lưu DB qua REST.
