# Cấu hình Tích hợp API OpenAI GPT

Tài liệu này hướng dẫn cách cấu hình API OpenAI phục vụ tính năng sinh câu hỏi tự động bằng AI trong hệ thống EduGuard.

## 1. Lưu trữ cấu hình trong cơ sở dữ liệu

Cấu hình GPT (API Key, Model, Base URL) được lưu trong bảng `GptSettings` (SQL Server), quản lý qua trang Admin **Cấu hình Mô hình GPT** (`/admin/gpt-model`).

Giảng viên (Teacher role) **không thể** xem hoặc chỉnh sửa các thông số này. Chỉ Admin mới có quyền cấu hình và kiểm tra kết nối.

Khi chưa có giá trị trong DB, hệ thống vẫn đọc fallback từ biến môi trường hoặc `appsettings.json` (xem mục 2).

## 2. Biến môi trường / appsettings (fallback)

| Khóa | Giá trị mặc định | Mô tả |
|------|------------------|-------|
| `OPENAI_API_KEY` / `OpenAI:ApiKey` | *(Trống)* | API Key OpenAI (`sk-proj-...`). |
| `OPENAI_MODEL` / `OpenAI:Model` | `gpt-5.4` | Model mặc định sinh câu hỏi. |
| `OPENAI_BASE_URL` / `OpenAI:BaseUrl` | `https://api.openai.com/v1` | URL API OpenAI hoặc proxy tương thích. |

File `.env` ở thư mục gốc vẫn được nạp khi khởi động (`EnvFileHelper.LoadEnv`) để hỗ trợ dev local; **lưu từ giao diện Admin ghi vào DB**, không ghi `.env`.

## 3. API Admin

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/gpt/settings` | Lấy cấu hình (API Key được mask). |
| POST | `/api/admin/gpt/settings` | Lưu cấu hình vào DB. |
| POST | `/api/admin/gpt/test-connection` | Gọi `GET /v1/models` để kiểm tra API Key. |

## 4. Migration

Sau khi deploy backend mới, chạy:

```powershell
cd backend
dotnet ef database update --project EduGuard.Infrastructure --startup-project EduGuard.Api
```
