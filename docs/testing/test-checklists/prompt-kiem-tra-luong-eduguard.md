# Prompt kiểm tra toàn bộ luồng hoạt động EduGuard

## Mục tiêu

Bạn hãy kiểm tra toàn bộ luồng hoạt động của project **EduGuard**, bao gồm **Frontend ReactJS** và **Backend ASP.NET Core Web API**.

Mục tiêu chính:

- Kiểm tra từng màn hình, từng nút bấm, từng form, từng dropdown, từng link điều hướng.
- Nút nào chưa hoạt động thì sửa để hoạt động đúng.
- Form nào chưa gọi API thì kết nối API.
- API nào chưa có hoặc sai endpoint thì tạo/sửa ở Backend.
- Luồng nào bị lỗi thì sửa triệt để, không chỉ sửa giao diện.

## Công nghệ project

- Frontend: ReactJS + TailwindCSS
- Backend: ASP.NET Core Web API
- Database: SQL Server
- Realtime nếu có: SignalR
- Cache nếu có: Redis

---

## 1. Kiểm tra cấu trúc project

- Xác định thư mục Frontend và Backend.
- Xác định file cấu hình API client ở Frontend, ví dụ:
  - `axiosClient`
  - `authApi`
  - `classroomApi`
  - `examApi`
  - `dashboardApi`
  - `userApi`
- Xác định các controller ở Backend.
- Xác định các DTO, service, repository, DbContext nếu có.
- Không tự ý đổi kiến trúc project nếu không cần thiết.

---

## 2. Kiểm tra luồng Authentication

Hiện tại đang refresh trang khi nhập sai tên đăng nhập hoặc mật khẩu.

Yêu cầu sửa:

- Khi nhập sai tên đăng nhập hoặc mật khẩu, trang không được refresh.
- Hiển thị thông báo lỗi trực tiếp ra màn hình.
- Không được mất dữ liệu form nếu không cần thiết.
- Kiểm tra lại các luồng:
  - Đăng nhập.
  - Đăng ký.
  - Đăng xuất.
  - Lưu token.
  - Refresh token nếu project có.
  - Điều hướng sau đăng nhập.
  - Chặn truy cập route khi chưa đăng nhập.
  - Phân quyền theo role nếu có: Admin, Teacher, Student.

---

## 3. Kiểm tra Dashboard

- Các card thống kê có lấy dữ liệu thật từ API không.
- Nếu đang dùng mock data thì thay bằng API thật nếu Backend đã có.
- Nếu Backend chưa có API dashboard thì tạo endpoint cần thiết.
- Kiểm tra:
  - Loading state.
  - Empty state.
  - Error state.
  - Dữ liệu hiển thị đúng theo role người dùng.

---

## 4. Kiểm tra luồng Quản lý lớp học

Kiểm tra và sửa các chức năng sau:

- Nút tạo lớp học.
- Nút sửa lớp học.
- Nút xóa lớp học.
- Nút xem chi tiết lớp học.
- Click vào tên lớp để đi tới chi tiết lớp học.
- Copy mã lớp nếu còn dùng.
- Tham gia lớp bằng mã lớp nếu có.
- Danh sách thành viên lớp.
- API lấy danh sách lớp theo người dùng hiện tại.
- API lấy chi tiết lớp.
- API thêm/xóa thành viên nếu có.

Kiểm tra lại quyền:

- Giảng viên được tạo/sửa/xóa lớp.
- Sinh viên chỉ được tham gia/xem lớp.
- Admin nếu có thì được quản lý dữ liệu theo quyền hệ thống.

---

## 5. Kiểm tra luồng Quản lý bài kiểm tra / bài thi

Kiểm tra và sửa các chức năng sau:

- Nút tạo bài kiểm tra.
- Nút sửa bài kiểm tra.
- Nút xóa bài kiểm tra.
- Nút xem chi tiết.
- Nút thêm câu hỏi.
- Nút sửa câu hỏi.
- Nút xóa câu hỏi.
- Nút publish bài kiểm tra.
- Nút bắt đầu làm bài ở phía sinh viên.

Yêu cầu kỹ thuật:

- Kiểm tra dữ liệu gửi lên API có đúng DTO Backend không.
- Kiểm tra route có truyền đúng `examId` / `classroomId` không.
- Kiểm tra trạng thái bài kiểm tra sau khi publish.
- Kiểm tra quyền: giảng viên quản lý bài kiểm tra, sinh viên chỉ được xem/làm bài khi được phép.

---

## 6. Kiểm tra luồng làm bài của sinh viên

Kiểm tra và sửa các chức năng sau:

- Sinh viên vào bài thi được.
- Hiển thị câu hỏi.
- Chọn đáp án.
- Lưu đáp án tạm nếu có.
- Nộp bài.
- Chặn nộp nhiều lần nếu yêu cầu nghiệp vụ có.
- Hiển thị điểm/kết quả nếu có.
- Kiểm tra trạng thái bài làm nếu project có enum tương ứng:
  - `InProgress`
  - `Submitted`
  - `Graded`

Yêu cầu bổ sung:

- Không cho sinh viên làm bài nếu bài chưa publish.
- Không cho làm lại nếu đã nộp, trừ khi nghiệp vụ cho phép.
- Nếu API trả lỗi, phải hiển thị thông báo rõ ràng trên giao diện.

---

## 7. Kiểm tra luồng anti-cheat nếu có

Kiểm tra và sửa các chức năng sau:

- Phát hiện chuyển tab.
- Phát hiện copy/paste.
- Phát hiện mất focus.
- Phát hiện fullscreen exit nếu có.
- Gửi log gian lận về Backend.
- Backend lưu `CheatingLog` đúng:
  - `attemptId`
  - `studentId`
  - `examId`
  - loại hành vi
  - thời gian ghi nhận

Nếu có SignalR:

- Kiểm tra realtime log về dashboard giảng viên.
- Kiểm tra Hub ở Backend.
- Kiểm tra connection ở Frontend.
- Kiểm tra endpoint mapping Backend.
- Nếu SignalR chưa hoạt động thì sửa để chạy được.

---

## 8. Kiểm tra Profile / User menu

Kiểm tra và sửa các chức năng sau:

- Nút thông tin cá nhân.
- Nút đổi mật khẩu.
- Nút chế độ tối.
- Nút đăng xuất.
- Các dropdown có mở/đóng đúng không.
- Click bên ngoài dropdown thì tự đóng nếu UI đang yêu cầu.
- Kiểm tra lại trạng thái đăng nhập sau khi logout.
- Không cho user quay lại trang private bằng nút Back của trình duyệt nếu đã logout.

---

## 9. Kiểm tra API mapping

Với mỗi nút hoặc form ở Frontend, hãy lập mapping theo mẫu sau:

| Màn hình | Nút / chức năng | Hàm xử lý React | API được gọi | Controller/action Backend | Trạng thái |
|---|---|---|---|---|---|
| Ví dụ: Login | Đăng nhập | `handleLogin()` | `POST /api/auth/login` | `AuthController.Login` | Hoạt động / lỗi / chưa nối API |

Trạng thái cần phân loại rõ:

- Hoạt động.
- Lỗi.
- Chưa có API.
- Chưa nối API.
- Sai route.
- Sai DTO.
- Sai quyền.
- Sai xử lý lỗi.

Sau đó sửa các mục lỗi hoặc chưa nối API.

---

## 10. Kiểm tra lỗi runtime

Thực hiện các bước sau:

- Chạy Backend bằng:

```bash
dotnet run
```

- Chạy Frontend bằng:

```bash
npm run dev
```

- Mở browser console kiểm tra lỗi.
- Kiểm tra Network tab xem API nào trả:
  - `400`
  - `401`
  - `403`
  - `404`
  - `500`
  - `429`

Nguyên tắc sửa lỗi:

- Sửa theo nguyên nhân thật.
- Không che lỗi bằng `try/catch` rỗng.
- Nếu Swagger lỗi, mở trực tiếp:

```txt
/swagger/v1/swagger.json
```

- Nếu API trả `401`, kiểm tra token/header `Authorization`.
- Nếu API trả `403`, kiểm tra role/quyền truy cập.
- Nếu API trả `404`, kiểm tra route Frontend và route Controller.
- Nếu API trả `500`, kiểm tra exception Backend.
- Nếu API trả `429`, kiểm tra rate limit, retry loop hoặc frontend gọi API lặp vô hạn.

---

## 11. Quy tắc sửa code

- Không xóa chức năng cũ nếu chưa chắc.
- Không thay đổi tên route/API tùy tiện nếu Frontend đang dùng.
- Ưu tiên sửa nhỏ, đúng chỗ.
- Không hardcode dữ liệu nếu đã có API.
- Không dùng mock data cho luồng chính nếu Backend đã có dữ liệu thật.
- Không làm vỡ responsive UI hiện tại.
- Không đổi màu/giao diện lớn nếu nhiệm vụ chỉ là sửa luồng hoạt động.
- Không tạo file trùng lặp không cần thiết.
- Nếu thiếu API thì tạo controller/service/DTO đúng kiến trúc hiện có.
- Nếu thiếu hàm Frontend thì thêm vào đúng file API tương ứng.
- Sau mỗi nhóm sửa, hãy build/test lại.

---

## 12. Output sau khi hoàn thành

Hãy trả về báo cáo gồm:

- Danh sách chức năng đã kiểm tra.
- Danh sách nút/form đã sửa.
- Danh sách API đã thêm hoặc đã sửa.
- Danh sách lỗi còn tồn tại nếu có.
- Hướng dẫn chạy lại project.
- Các tài khoản test nếu project có seed user.
- Những phần cần người dùng xác nhận thêm nếu thiếu nghiệp vụ.

---

## Yêu cầu quan trọng

- Hãy đọc code hiện có trước khi sửa.
- Không được phỏng đoán cấu trúc project.
- Không được chỉ sửa giao diện mà bỏ qua API.
- Mục tiêu cuối cùng là người dùng có thể bấm thử từng nút trên giao diện và luồng chạy thật từ Frontend xuống Backend.
