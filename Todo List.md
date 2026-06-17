# EduGuard — Todo List

> Lộ trình: `docs/06_DEVELOPMENT_ROADMAP.md` · Quy tắc: `docs/07_DEVELOPMENT_RULES.md`  
> Nguyên tắc: **Chạy được → Đăng nhập được → Quản lý lớp được → Tạo bài thi được → Làm bài được → Giám sát được → Tối ưu được**

**Branch làm việc:** `devH`  
**Cập nhật:** 2026-06-16 (backend Phase 7 anti-cheat xong; Phase 3–6 backend xong; frontend auth + classroom + exam đã nối backend thật ở các màn hiện có; Identity/user id hiện dùng string GUID và frontend adapters đã giữ `UserDto.Id`/`TeacherId`/`StudentId` dạng string để không bị ép về `0`; teacher tạo đề có thể publish ngay khi tạo, thời gian đóng đề tự tính theo thời gian mở + số phút làm bài nhưng vẫn cho chỉnh tay; classroom detail nay đã có assignment thật, student đã có màn làm bài riêng với timer + auto submit, teacher exam detail đã có attempt monitor và anti-cheat REST cơ bản; dashboard và user/profile vẫn còn bridge/mock ở những phần backend chưa cung cấp endpoint tương ứng; role UI đã được giản lược theo hướng title-only cho block/chức năng chính và workspace màu sáng đã rà lại theo design tokens preview; auth session giờ tự refresh token khi role backend đổi để tránh 403 lệch quyền ở các màn Teacher/Admin; app shell đã dùng chung cho các role và sidebar lấy menu động theo role; auth shell, page header, empty/loading/summary card đã đồng bộ lại theo design token và đã bỏ các hardcode màu/shadow còn lại trong JSX frontend; login sai thông tin giờ hiển thị đúng câu `Bạn đã nhập sai tài khoản hoặc mật khẩu`; sidebar nay đã được khóa mở cố định cho mọi role, đã gỡ toàn bộ cơ chế drawer/collapse/toggle trượt ra vào, đã đưa panel menu bám sát mép trái màn hình và đã bỏ bo góc ở cạnh trái để panel đi thẳng theo mép viewport; form tạo/sửa đề thi của giảng viên giờ quy đổi cố định theo giờ Việt Nam, tự đồng bộ giờ đóng đề = giờ mở đề + thời lượng và vẫn cho phép đặt giờ đóng muộn hơn khi cần; panel trái auth đã được rút gọn theo hướng tối giản với logo ở giữa, chữ `EduGuard` bên dưới và 2 dòng thông điệp thương hiệu tách riêng không xuống hàng; frontend exam/attempt giờ parse thống nhất các timestamp ISO không kèm múi giờ như UTC để thời gian hiển thị sau khi lưu không còn lệch so với lúc nhập; classroom list nay đã được tinh gọn theo role, trong đó màn sinh viên chỉ còn danh sách lớp, không còn 3 ô thống kê đầu trang và tên lớp có hover rõ hơn để đi vào chi tiết; teacher classroom list vẫn giữ tiêu đề kèm `Tổng lớp học` và card lớp dùng tên lớp làm điểm click vào chi tiết với ô `Mã lớp` riêng thay cho footer action; đã rà soát parity BE/FE và nối nốt luồng xóa thành viên khỏi lớp cho giảng viên chủ lớp từ endpoint backend sẵn có)
**Quy tắc:** `docs/07_DEVELOPMENT_RULES.md`

---

## Trạng thái tổng quan

| Giai đoạn | Tên | Trạng thái |
|-----------|-----|------------|
| 0 | Khởi tạo project | ✅ Hoàn thành |
| 1 | Database + Entity nền tảng | ✅ Hoàn thành |
| 2 | Authentication & Authorization | 🟡 Backend xong, FE auth thật xong; profile/avatar vẫn còn mock |
| 3 | Classroom Management | 🟡 Backend xong (8/8 API), FE classroom thật xong cho teacher/student; admin còn phụ thuộc giới hạn endpoint BE |
| 4 | Assignment Management | 🟡 Backend + FE core xong; trạng thái bài nộp của student sau reload còn giới hạn do BE chưa có endpoint lấy bài nộp cá nhân |
| 5 | Exam Management | 🟡 Backend xong (11/11 API), FE exam thật xong cho list/detail/question bank hiện có |
| 6 | Online Testing / Exam Attempt | ✅ Backend + FE core xong (start/resume, save answer, timer, auto submit, result, teacher attempt monitor) |
| 7 | Anti-cheat Monitoring | ✅ Backend + FE REST cơ bản xong (hook student + monitor teacher); realtime vẫn thuộc Phase 8 |
| 8 | SignalR Realtime | ⬜ Chưa bắt đầu |
| 9 | Redis | ⬜ Chưa bắt đầu |
| 10 | Dashboard & Reporting | 🟡 Đang làm |
| 11 | Docker Compose | ⬜ Chưa bắt đầu |

---

## Giai đoạn 0 — Khởi tạo project

**Mục tiêu:** Frontend gọi được backend thành công.

- [x] Tạo repo EduGuard
- [x] Tạo folder `backend/`
- [x] Tạo solution `EduGuard.slnx`
- [x] Tạo 4 project backend (Api, Application, Domain, Infrastructure)
- [x] Tạo cấu trúc folder `frontend/` (scaffold)
- [x] Thêm bộ tài liệu `docs/`
- [x] Tạo React Vite project trong `frontend/`
- [x] Cấu hình TailwindCSS (deps + `@import "tailwindcss"` trong `index.css`)
- [x] Cấu hình Swagger (mặc định ASP.NET Core, dev)
- [x] Cấu hình CORS cho React dev server (`http://localhost:5173`, `http://127.0.0.1:5173`)
- [x] Tạo `TestController` → `GET /api/Test`
- [x] React gọi thử `GET /api/test` và hiển thị kết quả JSON

**Tiêu chí hoàn thành:** ✅ Mở React → gọi API → nhận response JSON từ backend (đã verify 2026-06-10; local Development HTTP không ép redirect HTTPS để Vite proxy không lỗi Network Error khi login).

---

## Giai đoạn 1 — Database + Entity nền tảng

**Mục tiêu:** SQL Server có database và các bảng cơ bản.

### Domain — Entity

- [x] `ApplicationUser` (kế thừa `IdentityUser` với khóa `string` GUID)
- [x] `RefreshToken` (custom — rotate/revoke JWT)
- [x] `Classroom`
- [x] `ClassroomMember`
- [x] Package Domain: `Microsoft.Extensions.Identity.Stores`

### Infrastructure

- [x] `AppDbContext` kế thừa `IdentityDbContext<ApplicationUser>` với `IdentityRole` khóa `string`
- [x] Map tên bảng: `Users`, `Roles`, `UserRoles` (tuỳ chọn)
- [x] Seed roles: Admin, Teacher, Student
- [x] EF Fluent API: RefreshToken, Classroom, ClassroomMember
- [x] Package: `Microsoft.AspNetCore.Identity.EntityFrameworkCore`
- [x] Connection string SQL Server (`appsettings.json` → `EduGuardExam`)
- [x] `Add-Migration InitialIdentityAndClassroom`
- [x] `Update-Database`

**Tiêu chí hoàn thành:** ✅ Database `EduGuardExam` có schema Identity + `RefreshTokens` + `Classrooms` + `ClassroomMembers`; 3 role seed (đã verify 2026-06-10).

---

## Giai đoạn 2 — Authentication & Authorization

**Mục tiêu:** User đăng ký/đăng nhập được và nhận JWT token.

### Backend

- [x] `AddIdentity` + `AddEntityFrameworkStores<AppDbContext>`
- [x] `IJwtTokenService` + `JwtTokenService` (access token)
- [x] `IRefreshTokenService` hoặc logic refresh trong `AuthService`
- [x] `IAuthService` + `AuthService` (`UserManager`, `SignInManager`, `RoleManager`)
- [x] DTOs: `RegisterRequest`, `LoginRequest`, `LoginResponse`, `UserDto`
- [x] FluentValidation cho Register/Login
- [x] `AuthController`: register, login, refresh, logout, me
- [x] JwtBearer trong `AddInfrastructure` + Swagger Bearer
- [x] `[Authorize(Roles = "...")]` — `GET /api/Test/teacher-only`
- [x] Test qua Swagger (manual) — đã verify 2026-06-10

*(Không dùng `IUserRepository` / hash password thủ công cho auth.)*

### Frontend

- [x] Trang Login / Register *(đã gọi backend thật theo `POST /api/auth/register` và `POST /api/auth/login`; đã thiết kế lại layout xác thực theo bố cục 2 cột, thêm checkbox ghi nhớ đăng nhập và link quên mật khẩu dạng UI placeholder; panel trái auth nay dùng bố cục tối giản với logo ở giữa, chữ `EduGuard` bên dưới và 2 dòng `Học Tập an toàn` / `Thi trực tuyến minh bạch` tách riêng, không xuống hàng)*
- [x] Axios client + interceptor gắn `Authorization` *(đã gắn Bearer token thật cho request protected)*
- [x] Lưu `accessToken` *(đã lưu access token và refresh token backend theo shape JWT flow)*
- [x] Protected routes theo role *(đã tách route riêng cho Admin / Teacher / Student)*
- [x] Trang hồ sơ cá nhân và cập nhật thông tin *(phiên đăng nhập lấy từ `GET /api/auth/me`; màn hồ sơ hiện vẫn dùng mock users API; đã hỗ trợ upload avatar từ máy và preview trước khi lưu)*
- [x] Popup toast toàn app cho thông báo thao tác/lỗi *(góc trên bên phải, tự ẩn sau 3 giây, đã thêm thông báo đăng nhập/đăng xuất thành công)*
- [x] Đồng bộ session backend vào app mock hiện tại *(user đăng nhập backend thật vẫn dùng tiếp được classroom/dashboard/exam đang còn mock; khi role đổi trong DB, app sẽ tự refresh token để claim quyền khớp lại với `/api/auth/me`)*
- [x] Tương thích Identity string GUID *(session chấp nhận `UserDto.Id` dạng string; classroom/exam/assignment/attempt/anti-cheat adapters giữ `TeacherId`/`StudentId` dạng string để so sánh quyền và cache không bị sai)*
- [x] Layout dùng chung cho khu đăng nhập theo vai trò *(đã bỏ navbar trên cùng cũ, đưa header workspace mới lên trên, thêm dropdown người dùng, dùng logo nền trong suốt `public/logo-transparent.png`, bỏ cờ Việt Nam, thêm dấu `v` cho card cá nhân, phóng logo top bar ngang chiều cao chữ, dọn menu/sidebar Admin và rút sidebar còn điều hướng; AppShell hiện dùng chung cho mọi role, menu bên trái lấy động từ role config, sidebar đã được khóa mở cố định thay vì dùng drawer/toggle trượt ra vào, panel menu đã được đưa bám sát mép trái màn hình và cạnh trái của panel đã bỏ bo góc để đi thẳng theo viewport; dropdown cá nhân đã bật/tắt được chế độ tối thật cho khu vực app đã đăng nhập)*

- [x] Đồng bộ lại design system cho các surface dùng chung *(auth shell đã render `description` đúng, hero/auth panel wrap tốt hơn trên mobile; page header, empty state, loading panel và summary card chuyển sang dùng token/chung class thay cho màu và shadow hardcode trong JSX frontend)*
- [x] Thông báo login sai credentials + drawer toggle nhìn thấy được *(lỗi đăng nhập sai tài khoản/mật khẩu giờ hiển thị đúng câu chuẩn ở ngay form login; logic mở/đóng sidebar đã dồn về layout chung với state rõ ràng hơn, overlay đóng trực tiếp được, panel trượt từ sát cạnh trái bằng transform/transition dễ nhận biết hơn; nút 3 gạch hiện điều khiển ẩn/hiện menu trái cả trên desktop lẫn mobile, đã đưa ra khỏi top bar và thay luôn phần chữ `Menu chức năng` trong sidebar)*
- [x] Icon thu gọn sidebar trực quan hơn *(sau khi mở menu bằng nút 3 gạch, nút toggle trong sidebar giờ đổi sang mũi tên ngược chiều để người dùng hiểu ngay thao tác thu gọn menu thay vì thấy dấu đóng chung chung)*

**Tiêu chí hoàn thành:** Đăng ký → đăng nhập → nhận JWT → gọi API được bảo vệ; auth E2E qua Vite proxy đã verify 2026-06-15 sau migration Identity string.

---

## Giai đoạn 3 — Classroom Management

**Mục tiêu:** Teacher tạo lớp, Student tham gia bằng mã lớp.

### Backend

- [x] `ClassroomRepository` + `ClassroomService`
- [x] DTOs: `CreateClassroomRequest`, `ClassroomDto`, `JoinClassroomRequest`, `ClassroomMemberDto`
- [x] `POST /api/classrooms` — tạo lớp
- [x] `GET /api/classrooms` — danh sách lớp
- [x] `GET /api/classrooms/{id}` — chi tiết lớp
- [x] `PUT /api/classrooms/{id}` — cập nhật lớp
- [x] `DELETE /api/classrooms/{id}` — xóa lớp
- [x] `POST /api/classrooms/join` — tham gia bằng mã
- [x] `GET /api/classrooms/{id}/members` — danh sách thành viên
- [x] `DELETE /api/classrooms/{id}/members/{studentId}` — xóa thành viên

### Frontend

- [x] Trang danh sách lớp *(đã gọi `GET /api/classrooms`, FE tự bù `memberCount` khi role hiện tại được xem danh sách thành viên; header/card đã bỏ mô tả phụ để ưu tiên title + dữ liệu chính; riêng màn Teacher nay đưa `Tổng lớp học` lên cùng dòng tiêu đề, bỏ 2 ô thống kê phụ, bỏ footer button trong card và chuyển tên lớp thành link vào chi tiết; màn Student cũng đã bỏ 3 ô thống kê đầu trang để chỉ còn danh sách lớp; ô `Cập nhật` trong card đã đổi thành `Mã lớp` và hover tên lớp đã rõ hơn để vào detail)*
- [x] Form tạo lớp (Teacher) *(gửi thẳng `name`/`description`; `joinCode` do backend tự sinh thay vì random ở local)*
- [x] CRUD lớp học cho Teacher *(tạo ở list page, sửa/xóa ở detail page qua backend thật)*
- [x] Form nhập mã lớp (Student) *(đã gọi `POST /api/classrooms/join` bằng join code thật)*
- [x] Trang chi tiết lớp + thành viên *(đã đọc detail + members từ backend; admin chỉ xem được info cơ bản vì endpoint members hiện giới hạn theo BE; teacher chủ lớp giờ có thể xóa sinh viên khỏi lớp trực tiếp từ FE qua endpoint `DELETE /api/classrooms/{id}/members/{studentId}`)*
- [x] Route admin xem người dùng và lớp học tổng quan *(user list vẫn mock; classroom section đã phản ánh đúng dữ liệu backend hiện trả về cho `/api/classrooms`)*

**Tiêu chí hoàn thành:** Teacher tạo được lớp, Student tham gia được lớp.

---

## Giai đoạn 4 — Assignment Management

**Mục tiêu:** Luồng giao bài tập → nộp bài → chấm điểm.

### Backend

- [x] Entity `Assignment`, `Submission`
- [x] Migration `AddAssignmentsExamsAndAttempts`
- [x] `AssignmentsController` + Service + Repository (8 API)
- [x] API tạo / sửa / xóa / xem bài tập theo lớp
- [x] API nộp bài + danh sách bài nộp
- [x] API chấm điểm (`POST /api/submissions/{id}/grade`)

### Frontend

- [x] Danh sách bài tập theo lớp *(đã gắn trực tiếp vào classroom detail cho Teacher / Student / Admin theo quyền hiện tại)*
- [x] Form tạo bài tập (Teacher) *(teacher tạo và sửa bài tập ngay trong classroom detail bằng API thật)*
- [x] Form nộp bài (Student) *(student nộp bài ngay trong classroom detail; trạng thái đã nộp hiện được giữ ổn định trong local cache do BE chưa có endpoint lấy bài nộp cá nhân)*
- [x] Form chấm điểm (Teacher) *(teacher mở danh sách bài nộp, nhập điểm/nhận xét và lưu qua API thật)*

**Tiêu chí hoàn thành:** Luồng giao bài tập và nộp bài chạy được.

---

## Giai đoạn 5 — Exam Management

**Mục tiêu:** Teacher tạo đề thi hoàn chỉnh.

### Backend

- [x] Entity `Exam`, `ExamSetting`, `Question`, `Answer`
- [x] Migration `AddAssignmentsExamsAndAttempts`
- [x] `ExamsController` + Service + Repository (11 API + question bank)
- [x] API CRUD đề thi theo lớp
- [x] API thêm / sửa / xóa câu hỏi & đáp án
- [x] API publish đề thi *(cho phép công khai metadata trước; student chỉ start khi đề đã có câu hỏi)*

### Frontend

- [x] UI danh sách bài kiểm tra theo role *(đã gọi backend thật; FE gom đề thi bằng các classroom user đang truy cập được; card/list ưu tiên title + số liệu thay cho mô tả dài)*
- [x] UI tạo đề thi *(Teacher, gọi `POST /api/classrooms/{id}/exams`; có thể chọn publish ngay khi tạo; form thời gian nay dùng giờ Việt Nam cố định, giờ đóng đề mặc định tự tính = giờ mở đề + số phút làm bài và vẫn cho phép giảng viên chỉnh tay sang mốc muộn hơn nếu muốn mở rộng cửa sổ nộp cho sinh viên)*
- [x] Đồng bộ parse timestamp cho exam/attempt *(các chuỗi ISO backend không kèm timezone giờ được FE hiểu là UTC trước khi format sang giờ Việt Nam, nên sau khi tạo/sửa đề thi thì thời gian hiển thị ở list, detail, status và form sửa không còn lệch so với lúc lưu)*
- [x] UI xem chi tiết đề thi *(mọi role theo quyền truy cập; teacher detail có thêm average score từ attempt API và anti-cheat summary khi bật giám sát)*
- [x] UI cập nhật / xóa đề thi *(Teacher, có xác nhận xóa 2 bước và publish qua endpoint riêng)*
- [x] UI cấu hình đề thi *(thời gian mở-đóng, anti-cheat, fullscreen, random, max attempts, show result; classroom không còn đổi được sau khi tạo vì backend chưa hỗ trợ)*
- [x] UI quản lý câu hỏi & đáp án *(Teacher thêm/sửa/xóa câu hỏi qua backend thật; Admin xem được question bank; Student không thấy đáp án ở trang detail)*

**Tiêu chí hoàn thành:** Teacher tạo được đề thi hoàn chỉnh.

---

## Giai đoạn 6 — Online Testing / Exam Attempt

**Mục tiêu:** Student làm bài thi online và nhận kết quả.

### Backend

- [x] Entity `ExamAttempt`, `StudentAnswer`
- [x] `POST /api/exams/{id}/start` (resume in-progress, shuffle Q/A)
- [x] Random câu hỏi / đáp án theo `ExamSetting`
- [x] `POST /api/attempts/{id}/answers` — lưu đáp án từng câu
- [x] `POST /api/attempts/{id}/submit` — chấm tự động + tổng điểm
- [x] `GET /api/attempts/{id}/result` + `GET /api/exams/{id}/attempts` (teacher)

### Frontend

- [x] Màn hình làm bài *(student có route riêng `/student/attempts/:attemptId`, hỗ trợ start/resume và danh sách câu hỏi desktop/mobile)*
- [x] Countdown timer *(timer cố định trong header, cảnh báo khi còn ít thời gian)*
- [x] Auto submit khi hết giờ *(tự nộp khi đồng hồ về 0 và trả kết quả theo cấu hình đề thi)*

**Tiêu chí hoàn thành:** Student làm bài thi online và nhận kết quả.

---

## Giai đoạn 7 — Anti-cheat Monitoring

**Mục tiêu:** Ghi nhận hành vi bất thường và tính suspicion score.

### Backend

- [x] Entity `CheatingLog`
- [x] `AntiCheatController` + Service + Repository
- [x] API ghi log anti-cheat
- [x] API xem log theo attempt
- [x] API xem suspicion score
- [x] API tổng hợp anti-cheat theo đề thi (`GET /api/anti-cheat/exams/{examId}/summary`)

### Frontend

- [x] Bắt sự kiện chuyển tab *(ghi log `TAB_SWITCH` trong lúc làm bài)*
- [x] Bắt sự kiện copy/paste *(ghi log `COPY_PASTE` cho copy/cut/paste)*
- [x] Bắt sự kiện fullscreen *(ghi log `EXIT_FULLSCREEN` khi rời fullscreen)*
- [x] Bắt reload / mất kết nối cơ bản *(ghi log `PAGE_RELOAD` bằng keepalive và `DISCONNECTED` khi kết nối quay lại)*
- [x] Dashboard anti-cheat cho Teacher *(exam detail có attempt monitor, suspicion score và timeline log theo từng attempt)*

**Tiêu chí hoàn thành:** Hệ thống ghi nhận hành vi bất thường và tính điểm nghi ngờ.

---

## Giai đoạn 8 — SignalR Realtime

**Mục tiêu:** Teacher nhận cảnh báo ngay khi student có hành vi bất thường.

- [ ] `NotificationHub`
- [ ] `ExamMonitoringHub`
- [ ] Frontend kết nối SignalR
- [ ] Backend gửi notification
- [ ] Backend gửi anti-cheat warning
- [ ] Teacher dashboard nhận cảnh báo realtime

**Tiêu chí hoàn thành:** Cảnh báo realtime hiển thị trên dashboard Teacher.

---

## Giai đoạn 9 — Redis

**Mục tiêu:** Cache và trạng thái phiên thi tạm thời.

- [ ] Cấu hình Redis connection string
- [ ] `RedisCacheService`
- [ ] Cache exam questions
- [ ] Cache dashboard summary
- [ ] Lưu heartbeat attempt

**Tiêu chí hoàn thành:** Redis được dùng đúng mục đích, không chỉ thêm cho có.

---

## Giai đoạn 10 — Dashboard & Reporting

**Mục tiêu:** Trang tổng quan cho Admin, Teacher, Student.

- [ ] API dashboard Admin
- [ ] API dashboard Teacher
- [ ] API dashboard Student
- [ ] Thống kê số lớp, học sinh, bài tập, điểm thi
- [ ] Thống kê cheating score
- [x] Frontend dashboard Admin *(đã có mock API + UI tổng quan người dùng, lớp học, activity, anti-cheat; đã tách số liệu giảng viên và sinh viên thành thống kê riêng; block stat/timeline/metric đã bỏ mô tả phụ)*
- [x] Frontend dashboard Teacher *(đã có mock API + UI lớp quản lý, nộp bài, lịch thi, sinh viên rủi ro cao; đã bỏ mục điểm trung bình khỏi dashboard tổng quan; block stat/timeline/metric đã bỏ mô tả phụ)*
- [x] Frontend dashboard Student *(đã có mock API + UI tiến độ lớp, việc sắp tới, kết quả, thông báo; đã bỏ mục điểm trung bình khỏi dashboard tổng quan; block stat/timeline/metric đã bỏ mô tả phụ)*
- [x] Frontend biểu đồ dashboard *(mức cơ bản bằng stat card + progress bars, chưa dùng chart library)*

**Tiêu chí hoàn thành:** Người dùng có trang tổng quan dữ liệu theo role.

---

## Giai đoạn 11 — Docker Compose

**Mục tiêu:** Chạy toàn hệ thống bằng `docker compose up`.

- [ ] `Dockerfile` backend
- [ ] `Dockerfile` frontend
- [ ] `docker-compose.yml`
- [ ] Container SQL Server
- [ ] Container Redis
- [ ] Container backend
- [ ] Container frontend
- [ ] Test `docker compose up`

**Tiêu chí hoàn thành:** Hệ thống chạy được hoàn toàn trong Docker.

---

## Thứ tự ưu tiên MVP (thời gian gấp)

```txt
1. Hoàn thiện Giai đoạn 0 (FE ↔ BE kết nối)
2. Auth Identity + JWT
3. Classroom
4. Exam CRUD
5. Start Exam → Submit Exam
6. Anti-cheat log
7. Dashboard anti-cheat cơ bản
8. SignalR warning
9. Redis cache
10. Docker Compose
```

> Assignment (Giai đoạn 4) có thể làm song song hoặc sau Classroom.

---

## Hướng phát triển (ngoài MVP)

- AI Proctoring
- Facial Recognition
- AI Auto Grading
- Mobile App
- Multi-school Management
- Advanced Learning Analytics
- Cloud Deployment
