# Cấu hình Tích hợp API OpenAI GPT

Tài liệu này hướng dẫn cách cấu hình các biến môi trường phục vụ cho tính năng sinh câu hỏi tự động bằng AI trong hệ thống EduGuard.

## 1. Lưu trữ cấu hình trong file `.env`

Để tăng cường bảo mật, tất cả các thông tin nhạy cảm và thông số liên quan đến việc gọi API OpenAI đều được lưu trữ trực tiếp trong file `.env` đặt tại thư mục gốc của dự án thay vì lưu cứng trong mã nguồn hoặc tệp cấu hình `appsettings.json`.

Giảng viên (Teacher role) sẽ **không thể nhìn thấy** hoặc cấu hình các thông số này từ giao diện của họ. Chỉ có Quản trị viên (Admin role) mới có quyền xem, chỉnh sửa và thử nghiệm kết nối thông qua trang cấu hình hệ thống chuyên biệt.

## 2. Các biến môi trường hỗ trợ

Dưới đây là danh sách các khóa cấu hình được định nghĩa trong file `.env`:

| Biến môi trường | Giá trị mặc định | Mô tả |
|-----------------|------------------|-------|
| `OPENAI_API_KEY` | *(Trống)* | API Key cung cấp bởi OpenAI (dạng `sk-proj-...`). |
| `OPENAI_MODEL` | `gpt-5.4` | Mô hình ngôn ngữ mặc định sử dụng để sinh câu hỏi. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | URL gốc của dịch vụ API OpenAI hoặc Proxy tương thích. |

## 3. Quy trình tải cấu hình tự động (Backend)

Hệ thống backend ASP.NET Core sử dụng lớp tiện ích `EnvFileHelper` để tự động dò tìm và nạp các biến này từ file `.env` vào bộ nhớ khi khởi động:
- Lớp `EnvFileHelper` sẽ ánh xạ trực tiếp các biến môi trường tiêu chuẩn sang định dạng biến môi trường cấu hình kép của ASP.NET Core (ví dụ: `OPENAI_API_KEY` tương ứng với biến cấu hình `OpenAI:ApiKey`).
- Trường hợp biến môi trường không được định nghĩa, hệ thống sẽ sử dụng các giá trị dự phòng (fallback) cấu hình sẵn trong `appsettings.json`.

## 4. Kiểm tra kết nối (API Testing)

Quản trị viên có thể kiểm tra trực tiếp tính khả dụng của API Key và địa chỉ API thông qua chức năng **"Test API Connection"** ở giao diện Admin.
- API Endpoint phía backend: `POST /api/admin/gpt/test-connection`
- Logic kiểm tra sẽ thực hiện gửi một yêu cầu truy vấn danh sách mô hình hiện có từ OpenAI (`GET /v1/models`) để kiểm tra quyền truy cập hợp lệ trước khi chính thức lưu cấu hình vào file `.env`.
