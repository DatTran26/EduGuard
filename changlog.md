# EduGuard Local Changelog

## 2026-06-18 - Backend import file chuẩn tạo câu hỏi trắc nghiệm

### Mục tiêu

- Hoàn thiện backend upload/import file dùng để tạo câu hỏi trắc nghiệm cho bài kiểm tra theo định chuẩn đã duyệt.
- Chỉ xử lý nhóm trắc nghiệm trước: `single_choice`, `multiple_choice`, `true_false`.
- Tự luận ngắn/dài, OCR PDF scan, ZIP/media để phát triển sau.

### Thay đổi chính

- Thêm endpoint `POST /api/exams/{id}/questions/import` nhận multipart form field `file`.
- Mở quyền endpoint import cho `Teacher` và `Admin`.
- Teacher chỉ import được vào đề do mình tạo; Admin import được vào bất kỳ đề nào.
- Hỗ trợ file đúng định chuẩn:
  - `.csv`
  - `.xlsx`
  - `.txt`
  - `.docx`
  - PDF có text thật (`.pdf`)
- Từ chối có giải thích với:
  - `.doc` -> yêu cầu chuyển `.docx`
  - `.xls` -> yêu cầu chuyển `.xlsx`
  - `.zip` -> chờ luồng media/file đính kèm
- Validate toàn bộ file trước khi lưu; nếu có lỗi thì không ghi bất kỳ câu hỏi nào vào database.
- Append câu hỏi import vào cuối danh sách câu hỏi hiện có của đề.
- Trả lỗi theo dòng/câu và field để frontend sau này hiển thị cho giáo viên/admin sửa file.

### File/module backend đã thay đổi

- `backend/EduGuard.Api/Controllers/exams-controller.cs`
- `backend/EduGuard.Application/DTOs/Exams/question-import-error-dto.cs`
- `backend/EduGuard.Application/DTOs/Exams/question-import-result-dto.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-exam-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-service.cs`
- `backend/EduGuard.Infrastructure/Exams/question-import-parser.cs`

### Tài liệu/tracking đã cập nhật

- `docs/09_QUESTION_BANK_FILE_IMPORT_STANDARD.md`
- `docs/README.md`
- `docs/apiList.md`
- `docs/features.md`
- `docs/project-changelog.md`
- `Todo List.md`

### Validation đã thực hiện

- Backend build -> thành công, 0 warning, 0 error.
- Backend test -> thành công exit code 0.
- Parser smoke test -> pass với `.csv`, `.xlsx`, `.txt`, `.docx`, PDF text.
- E2E backend qua API thật -> pass: import CSV định chuẩn 3 dòng vào đề thi, lưu đủ `single_choice`, `multiple_choice`, `true_false` và kiểm tra đáp án đúng hợp lệ.

### Giới hạn còn lại

- Frontend upload UI chưa làm.
- Chưa có preview/confirm import phía frontend.
- Chưa hỗ trợ `short_answer`, `essay`.
- Chưa hỗ trợ ZIP/media và OCR PDF scan.
- Chưa lưu lịch sử import batch và chưa phát hiện câu hỏi trùng.

## 2026-06-18 - Fix lỗi 502 giữa frontend và backend khi chạy local

### Mục tiêu

- Sửa lỗi frontend không gọi được backend qua Vite proxy, dẫn tới API trả 502.
- Đảm bảo Swagger backend và frontend dev server giao tiếp được khi chạy local.

### Nguyên nhân

- Vite proxy đang trỏ `https://127.0.0.1:7168`.
- Backend profile `http` mặc định của dự án chạy ở `http://localhost:5157`.
- `project.assets.json` từng bị restore hỏng/offline, khiến `dotnet run` báo `NU1301` trước khi backend start.
- Vite dev server cũ cần restart để nhận config proxy mới.

### Thay đổi chính

- `frontend/vite.config.js`:
  - Default proxy target đổi sang `http://127.0.0.1:5157`.
  - Thêm `VITE_DEV_API_TARGET` để override khi cần chạy HTTPS profile.
  - Giữ `secure: false` cho trường hợp target HTTPS self-signed.
- `frontend/README.md`:
  - Cập nhật hướng dẫn chạy local theo backend HTTP `5157`.
  - Ghi rõ biến `VITE_DEV_API_TARGET` tùy chọn.
- Restore lại backend solution để `project.assets.json` trỏ về cache NuGet đúng của user.

### Validation đã thực hiện

- `dotnet restore backend\EduGuard.slnx` -> thành công.
- `dotnet build backend\EduGuard.slnx --no-restore` -> thành công, 0 warning, 0 error.
- `npm.cmd run build` -> thành công; còn warning sẵn có từ dependency SignalR/Rolldown và chunk size.
- `curl http://127.0.0.1:5157/swagger/index.html` -> HTTP 200.
- `curl http://127.0.0.1:5173` -> HTTP 200.
- `curl http://127.0.0.1:5173/api/Test` -> HTTP 200 và trả JSON backend: `EduGuard API is running`.

### Lưu ý còn lại

- Backend log có warning DataProtection về DPAPI key cũ không decrypt được trong user context hiện tại; chưa chặn Swagger/API/proxy nhưng nên xử lý riêng nếu log tiếp tục nhiễu.
- `frontend/package.json` hiện không có script `test`, nên validation frontend dùng `npm run build`.
