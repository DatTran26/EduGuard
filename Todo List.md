# EduGuard — Todo List

> Lộ trình: `docs/06_DEVELOPMENT_ROADMAP.md` · Quy tắc: `docs/07_DEVELOPMENT_RULES.md`  
> Nguyên tắc: **Chạy được → Đăng nhập được → Quản lý lớp được → Tạo bài thi được → Làm bài được → Giám sát được → Tối ưu được**

**Cập nhật:** 2026-06-26 (hợp nhất header compact và làm nổi bật màu sắc 4 khối stats của Bài tập/Bài thi trên nhánh `devH`)
**Ghi chú devH:** 2026-06-26 (notifications + UI redesign đã merge `release` qua PR #21; thiết kế lại trang Student `Bài tập / Bài thi`, dashboard/sidebar giáo viên, classrooms, notifications realtime)
**Ghi chú devH:** 2026-06-26 (đã gộp `/teacher/assignments` + `/teacher/exams` thành workspace chung `/teacher/tasks` với query `type=assignment|exam`, UI/shared mapper mới cho list-filter-detail-create, sidebar giáo viên còn một mục `Hoạt động học tập`, và các entry-point như quick-create, dashboard, classroom, question bank, shell search đều đã trỏ về route chung; phần soạn câu hỏi/chỉnh sâu đề thi vẫn giữ ở `ExamDetailPage`.)
**Ghi chú devH:** 2026-06-26 (đã làm gọn phần đầu trang `/teacher/tasks`: bỏ khoảng trắng lớn do `PageHeader` lồng trong hero, giảm padding/trang trí thừa, và rút gọn type switch còn đúng 2 lựa chọn để header thấp hơn nhưng không thêm nút phụ hay panel lọc mới.)
**Ghi chú devH:** 2026-06-26 (đã tách rõ khối danh sách và khối workspace trên `/teacher/tasks`, bỏ mọi nút `Mở chi tiết` dư thừa, cho phép chọn trực tiếp bằng card, và khi teacher bấm `Mở chấm bài` ở danh sách bài tập thì trang sẽ tự cuộn tới workspace chấm bài.)
**Ghi chú devH:** 2026-06-26 (đã tối giản thêm `/teacher/tasks` theo phản hồi UX: bỏ mô tả/eyebrow/badge dư ở header workspace để chỉ giữ lại title, đồng thời xóa hẳn block `Danh sách hoạt động` ở cột trái.)
**Ghi chú devH:** 2026-06-26 (đã rút gọn tiếp panel chi tiết bài tập ở `/teacher/tasks`: bỏ toàn bộ header/tóm tắt/mô tả lặp lại phía trên, giữ trọng tâm vào `Workspace chấm bài`; form chỉnh sửa vẫn chỉ hiện khi teacher chủ động bấm `Chỉnh sửa`.)
**Ghi chú devH:** 2026-06-26 (cho "Bài tập" và "Bài thi/Đề thi" dùng chung phần đầu trang compact siêu gọn, đồng thời thiết kế 4 khối stats lọc nhanh to hơn một chút, sử dụng tông màu nền/viền/chữ đậm và tương phản rõ nét để dễ phân biệt, làm nổi bật trạng thái active của bộ lọc đang chọn.)
**Ghi chú devB:** 2026-06-25 (đã hoàn tất Question Bank + Exam Matrix workspace theo integration devB: backend/frontend tách riêng, create-exam từ matrix chạy trong transaction và luôn tạo `ExamSetting`, Swagger dùng tag `QuestionBank`/`ExamMatrix`, `docs/apiList.md` có nhóm `API-QBK-*`/`API-MTX-*`, không thêm route/hub/entity proctoring.)
**Ghi chú devB:** 2026-06-25 (đã cập nhật UI ngân hàng câu hỏi theo luồng list trước/detail sau, form câu hỏi bank dạng panel ngang có thể thu gọn, list câu hỏi full-width có badge trạng thái/độ khó rõ dấu, nút nhảy sang ma trận, popup thiếu câu ma trận chi tiết, và thêm tab `Ngân hàng` trong flow tạo đề để chọn câu đã duyệt từ question bank.)
**Ghi chú devB:** 2026-06-20 (đã thêm file chuẩn import `.md` và prompt chuyển đổi vào backend resource; Teacher/Admin có thể tải file chuẩn trong question workspace, xem prompt thu gọn/mở rộng và copy toàn bộ prompt bằng nút ở góc phải.)
**Ghi chú devB:** 2026-06-15 (backend cấu hình bài kiểm tra UTC, validation publish trắc nghiệm MVP; Phase 8 SignalR xong; Phase 9 Redis — kế hoạch chi tiết)
**Ghi chú devH:** 2026-06-20 (đã chặn trường hợp `POST /api/auth/login` trả `401` làm trang đăng nhập refresh và mất form; đồng thời sửa các blocker compile của luồng import câu hỏi đề thi ở backend để build kiểm tra lại qua output tạm pass sạch. Luồng upload đề thi của Teacher nay kiểm tra định dạng file ở frontend, gọi backend preview ngay khi file hợp lệ, hiển thị câu hỏi + đáp án để review trước khi commit, và đẩy nút `Lưu đề` xuống bước cuối của create flow. Vừa bổ sung thêm fix cho create flow: lần lưu đầu sẽ gom cả câu hỏi soạn tay + câu hỏi đang preview, nếu tổng số câu > 0 thì tự publish ngay, còn nếu vẫn chưa có câu hỏi thì lưu ở trạng thái nháp. Sau đó tiếp tục vá lỗi `400` ở API tạo đề bằng cách không gửi các `answer.id` tạm kiểu string của draft/preview lên backend, đồng thời rút gọn card CTA cuối chỉ còn nút và bỏ message in-page "backend đã phân tích..." sau khi import preview thành công. Mới nhất đã bỏ hẳn submit DOM của nút `Tạo đề`, chuyển sang gọi callback submit trực tiếp từ `ExamForm` để bấm được ổn định ở create flow; đồng thời cho phép chỉnh sửa trực tiếp câu hỏi trong màn review import và khi lưu/commit sẽ tạo câu hỏi thật từ state đã chỉnh sửa thay vì import lại file gốc. Trước đó create-flow đề thi của Teacher đã chuyển sang soạn nháp cục bộ ngay trên `ExamListPage` để nhập câu hỏi/import preview trước rồi mới lưu toàn bộ một lần; backend tạo đề nay nhận kèm danh sách câu hỏi ngay trong request đầu tiên, đồng thời thêm endpoint preview import để nháp local không còn phải có `examId` trước; cùng lượt đã tách `ExamDetailPage` thành chế độ xem/chỉnh sửa riêng, đưa metadata lớp/giảng viên/lịch thi vào tooltip `Thông tin thêm`, bổ sung refresh + empty-state rõ nghĩa hơn cho bài tập trong classroom detail, và vừa đồng bộ shell/UI Teacher theo `docs/ui_tech.md` với menu mới, top bar search + quick-create, route teacher cho bài tập/giám sát/kết quả/thông báo, cùng workspace tab cho classroom detail. Mới nhất classroom detail của Teacher đã bỏ 2 nút tạo bài tập/đề thi trên header, làm nổi bật lại CTA `Sao chép mã lớp`, dồn phần xem thành viên về tab `Thành viên`, và đổi panel phụ ở `Tổng quan` thành hai nút ngang `Chỉnh sửa lớp học` / `Xoá Lớp học`.)
**Ghi chú devH:** 2026-06-17 (đã xử lý conflict khi pull từ `release` theo hướng giữ bản release; hoàn thiện FE cho cấu hình lịch thi UTC+7, chia nhóm form, bỏ checkbox publish, thêm checklist điều kiện publish và nút `Publish đề` gọi backend thật, đồng thời bổ sung hướng dẫn theo loại câu hỏi và thống kê đầy đủ các dạng câu ở trang chi tiết đề thi; khóa exact version dependency frontend, thêm `.npmrc` `save-exact` và chuẩn hóa `package-lock.json` để giảm conflict merge với `release`; làm mới UI đăng nhập theo layout 2 cột cân giữa màn hình với panel thương hiệu và login card riêng)
**Quy tắc:** `docs/07_DEVELOPMENT_RULES.md`

---

## Trạng thái tổng quan

| Giai đoạn | Tên | Trạng thái |
|-----------|-----|------------|
| 0 | Khởi tạo project | ✅ Hoàn thành |
| 1 | Database + Entity nền tảng | ✅ Hoàn thành |
| 2 | Authentication & Authorization | 🟡 Backend auth + admin user CRUD xong, FE auth/user management thật xong; profile/avatar vẫn còn mock |
| 3 | Classroom Management | 🟡 Backend xong (8/8 API), FE classroom thật xong cho teacher/student/admin; admin đã xem được toàn bộ classroom và member list theo dữ liệu backend |
| 4 | Assignment Management | ✅ Hoàn thành |
| 5 | Exam Management | 🟡 Backend/FE core xong; UI cấu hình UTC+7 + publish checklist/action đã nối backend, teacher question workspace 2 cột đã dùng chung cho detail + create flow trên list page, create-flow nay soạn nháp cục bộ và lưu đề một lần ở bước cuối, lần lưu đầu sẽ tự publish nếu đã có câu hỏi và giữ nháp nếu chưa có câu nào, upload/import file đã validate ở FE rồi gọi backend preview để hiện câu hỏi + đáp án review trước khi commit, exam detail đã tách rõ view/edit mode với tooltip thông tin thêm, question bank/matrix workspace đã có list/detail riêng và create-flow đã chọn được câu đã duyệt từ bank; còn backlog template browser đầy đủ |
| 6 | Online Testing / Exam Attempt | ✅ Backend + FE core xong (start/resume, save answer, timer, auto submit, result, teacher attempt monitor) |
| 7 | Anti-cheat Monitoring | ✅ Backend + FE REST cơ bản xong; realtime warning đã xử lý ở Phase 8 |
| 8 | SignalR Realtime | ✅ Hoàn thành |
| 9 | Redis | 🟡 Backend + FE heartbeat xong; manual test Redis CLI còn lại |
| 10 | Dashboard & Reporting | 🟡 Đang làm (devH: redesign teacher dashboard + notifications UI) |
| 11 | Docker Compose | ⬜ Chưa bắt đầu |
| 12 | Live Proctoring Control Room | ✅ v1 hoàn thành trên `feat/live-proctoring-control-room`; E2E thật + merge dev còn backlog |
| DOC | README giới thiệu hệ thống | ✅ Hoàn thành |

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
- [x] Khóa exact version dependency frontend (`packageManager`, `.npmrc`, `package-lock.json`) để tránh trôi bộ Vite/Tailwind/React khi sync hoặc merge giữa `devH` và `release`
- [x] Cấu hình Swagger (mặc định ASP.NET Core, dev)
- [x] Cấu hình CORS cho React dev server (`http://localhost:5173`)
- [x] Tạo `TestController` → `GET /api/Test`
- [x] React gọi thử `GET /api/test` và hiển thị kết quả JSON

**Tiêu chí hoàn thành:** ✅ Mở React → gọi API → nhận response JSON từ backend (đã verify 2026-06-10).

---

## Giai đoạn 1 — Database + Entity nền tảng

**Mục tiêu:** SQL Server có database và các bảng cơ bản.

### Domain — Entity

- [x] `ApplicationUser` (kế thừa `IdentityUser<int>`)
- [x] `RefreshToken` (custom — rotate/revoke JWT)
- [x] `Classroom`
- [x] `ClassroomMember`
- [x] Package Domain: `Microsoft.Extensions.Identity.Stores`

### Infrastructure

- [x] `AppDbContext` kế thừa `IdentityDbContext<ApplicationUser, IdentityRole<int>, int>`
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
- [x] API admin quản lí người dùng (`GET/POST/PUT/DELETE /api/users`) dùng ASP.NET Identity và chặn tự xóa / tự hạ quyền / tự khóa tài khoản
- [x] Test qua Swagger (manual) — đã verify 2026-06-10

*(Không dùng `IUserRepository` / hash password thủ công cho auth.)*

### Frontend

- [x] Trang Login / Register *(đã gọi backend thật theo `POST /api/auth/register` và `POST /api/auth/login`; đã làm lại layout xác thực theo bố cục 2 cột cân giữa toàn màn hình, brand panel navy gradient bên trái, card trắng bên phải, input/button/toast được tinh chỉnh rõ hierarchy hơn; vẫn giữ checkbox ghi nhớ đăng nhập và link quên mật khẩu dạng UI placeholder)*
- [x] Axios client + interceptor gắn `Authorization` *(đã gắn Bearer token thật cho request protected)*
- [x] Lưu `accessToken` *(đã lưu access token và refresh token backend theo shape JWT flow)*
- [x] Protected routes theo role *(đã tách route riêng cho Admin / Teacher / Student)*
- [x] Trang hồ sơ cá nhân và cập nhật thông tin *(phiên đăng nhập lấy từ `GET /api/auth/me`; màn hồ sơ hiện vẫn dùng mock users API; đã hỗ trợ upload avatar từ máy và preview trước khi lưu; giao diện đã làm lại theo hero profile nổi bật hơn, title-only card, khu avatar riêng và trạng thái `Đã đồng bộ` / `Chưa lưu` để student nhận biết rõ đang ở trang hồ sơ và thao tác cập nhật ngắn gọn hơn)*
- [x] Popup toast toàn app cho thông báo thao tác/lỗi *(góc trên bên phải, tự ẩn sau 3 giây, đã thêm thông báo đăng nhập/đăng xuất thành công)*
- [x] Đồng bộ session backend vào app mock hiện tại *(user đăng nhập backend thật vẫn dùng tiếp được classroom/dashboard/exam đang còn mock; khi role đổi trong DB, app sẽ tự refresh token để claim quyền khớp lại với `/api/auth/me`)*
- [x] Layout dùng chung cho khu đăng nhập theo vai trò *(đã bỏ navbar trên cùng cũ, đưa header workspace mới lên trên, thêm dropdown người dùng, dùng logo nền trong suốt `public/logo-transparent.png`, bỏ cờ Việt Nam, bỏ nút 3 gạch cạnh logo, thêm dấu `v` cho card cá nhân, phóng logo top bar ngang chiều cao chữ, dọn menu/sidebar Admin và rút sidebar còn điều hướng; dropdown cá nhân đã bật/tắt được chế độ tối thật cho khu vực app đã đăng nhập)*

**Tiêu chí hoàn thành:** Đăng ký → đăng nhập → nhận JWT → gọi API được bảo vệ.

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

- [x] Trang danh sách lớp *(đã gọi `GET /api/classrooms`, FE tự bù `memberCount` khi role hiện tại được xem danh sách thành viên; header/card đã bỏ mô tả phụ để ưu tiên title + dữ liệu chính)*
- [x] Form tạo lớp (Teacher) *(gửi thẳng `name`/`description`; `joinCode` do backend tự sinh thay vì random ở local)*
- [x] CRUD lớp học cho Teacher *(tạo ở list page, sửa/xóa ở detail page qua backend thật)*
- [x] Form nhập mã lớp (Student) *(đã gọi `POST /api/classrooms/join` bằng join code thật; sidebar Student cũng đã sửa logic active để route `/student/classrooms/join` không còn làm sáng nhầm mục `Lớp của tôi`)*
- [x] Trang chi tiết lớp + thành viên *(đã đọc detail + members từ backend; admin hiện cũng xem được danh sách thành viên thật để phần quản lí lớp học không còn lệch dữ liệu DB; classroom detail của Teacher nay làm nổi bật CTA `Sao chép mã lớp`, bỏ shortcut tạo bài tập/đề thi ở header, bỏ preview thành viên khỏi tab `Tổng quan`, và chuyển thao tác sửa/xóa thành cặp nút ngang với form chỉnh sửa chỉ mở khi cần)*
- [x] Route admin xem người dùng và lớp học tổng quan *(user list đã nối backend thật với CRUD thêm/sửa/xóa; backend chặn xóa cứng nếu user đã phát sinh dữ liệu liên quan và khuyến nghị khóa tài khoản thay vì xóa; classroom section đã đồng bộ dữ liệu backend thật cho admin, gồm cả memberCount suy ra từ member list thật)*

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

- [x] Danh sách bài tập theo lớp *(đã gắn trực tiếp vào classroom detail cho Teacher / Student / Admin theo quyền hiện tại; có thêm nút làm mới và empty-state nêu rõ lớp hiện tại để phân biệt giữa backend rỗng và lỗi render dữ liệu)*
- [x] Form tạo bài tập (Teacher) *(teacher tạo và sửa bài tập ngay trong classroom detail bằng API thật)*
- [x] Form nộp bài (Student) *(student nộp bài ngay trong classroom detail; trạng thái đã nộp nay đồng bộ giữa backend `mySubmission` và fallback cache ở frontend để màn `Bài kiểm tra -> Bài tập` không còn báo nhầm `Chưa nộp`; điểm số và nhận xét chấm điểm của sinh viên cũng xem được trực tiếp trên tab bài tập và trong phần xem chi tiết bài nộp của lớp học)*
- [x] Form chấm điểm (Teacher) *(teacher mở danh sách bài nộp, nhập điểm/nhận xét và lưu qua API thật)*

**Tiêu chí hoàn thành:** Luồng giao bài tập và nộp bài chạy được.

---

## Giai đoạn 5 — Exam Management

**Mục tiêu:** Teacher tạo đề thi hoàn chỉnh.

### Backend

- [x] Swagger shows multipart question import endpoint without 500 at `/swagger/v1/swagger.json`
- [x] Question import accepts XLSX files with title/instruction rows before the header and ignores trailing note rows
- [x] Teacher import templates standardized with no-accent file names in backend downloads
- [x] Question import parses all 20 teacher templates across CSV/XLSX/TXT/DOCX/PDF
- [x] Entity `Exam`, `ExamSetting`, `Question`, `Answer`
- [x] Migration `AddAssignmentsExamsAndAttempts`
- [x] `ExamsController` + Service + Repository (11 API + question bank)
- [x] API CRUD đề thi theo lớp
- [x] API thêm / sửa / xóa câu hỏi & đáp án
- [x] API upload/import file chuẩn tạo câu hỏi trắc nghiệm vào đề thi (`POST /api/exams/{id}/questions/import`) cho Teacher/Admin
- [x] Validate file import backend: `.csv`, `.xlsx`, `.txt`, `.docx`, PDF text, MIME type, giới hạn 5MB, cột/template bắt buộc, `question_type`, `correct_answer`, `score`
- [x] Import backend hỗ trợ `single_choice`, `multiple_choice`, `true_false`, `short_answer`; `essay` / tự luận dài để phát triển sau
- [x] API danh sách/tải file mẫu import câu hỏi (`GET /api/exams/question-import/templates`, `GET /api/exams/question-import/templates/{fileName}`) cho Teacher/Admin
- [x] API publish đề thi *(cho phép công khai metadata trước; student chỉ start khi đề đã có câu hỏi)*

### Frontend

- [x] UI danh sách bài kiểm tra theo role *(đã gọi backend thật; FE gom đề thi bằng các classroom user đang truy cập được; với admin, danh sách đề thi nay bám toàn bộ classroom backend trả về thay vì hụt dữ liệu do giới hạn access cũ; card/list ưu tiên title + số liệu thay cho mô tả dài. Với Student, trang `Bài tập / Bài thi` nay dùng segmented switch rõ ràng, chỉ render đúng một danh sách theo tab active, có toolbar lọc tối giản và card grid responsive cho cả bài tập lẫn bài thi.)*
- [x] UI tạo đề thi *(Teacher tạo đề ngay trên `ExamListPage`; có thể nhập câu hỏi, review/import file hoặc chọn câu đã duyệt từ ngân hàng câu hỏi vào đề nháp cục bộ trước, rồi bấm lưu toàn bộ đề một lần để backend tạo exam kèm câu hỏi; sau khi lưu xong mới chuyển sang flow chỉnh sửa đề đã có `examId`; thời gian đóng đề vẫn tự tính theo thời gian mở + số phút làm bài và vẫn chỉnh tay được)*
- [x] UI xem chi tiết đề thi *(mọi role theo quyền truy cập; teacher detail có thêm average score từ attempt API và anti-cheat summary khi bật giám sát; metadata lớp/giảng viên/lịch thi đã chuyển vào tooltip `Thông tin thêm`, còn form chỉnh sửa + workspace câu hỏi chỉ mở khi teacher bấm nút ở cột phải; workspace câu hỏi vẫn là block full-width riêng để list câu hỏi đọc thoáng hơn)*
- [x] UI cập nhật / xóa đề thi *(Teacher, có xác nhận xóa 2 bước và publish qua endpoint riêng)*
- [x] UI cấu hình đề thi *(thời gian mở-đóng, anti-cheat, fullscreen, random, max attempts, show result; classroom không còn đổi được sau khi tạo vì backend chưa hỗ trợ)*
- [x] UI quản lý câu hỏi & đáp án *(Teacher thêm/sửa/xóa câu hỏi qua backend thật; Admin xem được question bank; Student không thấy đáp án ở trang detail)*
- [x] UI upload file chuẩn tạo câu hỏi trắc nghiệm bài kiểm tra *(Teacher có workspace 2 cột trong exam detail: composer bên trái, list câu hỏi bên phải; đã có mode `Nhập từ file`, chọn file, review trước khi commit và không ghi thẳng vào đề ngay khi chọn file)*
- [x] Hiển thị lỗi import theo từng dòng/cột từ backend *(sau khi commit import lỗi, FE hiển thị danh sách lỗi theo `dòng / field / message` ngay trong panel review thay vì chỉ toast chung)*
- [x] UI ngân hàng câu hỏi và ma trận đề thi *(route `/teacher/question-banks` mở bằng danh sách bank trước; bấm bank mới vào màn chỉnh sửa, form câu hỏi bank dạng panel ngang có thể thu gọn, list câu hỏi full-width, badge trạng thái/độ khó có dấu nhận diện, nút nhảy sang ma trận, và popup ma trận nêu rõ đang thiếu điều kiện nào/cần bao nhiêu/có bao nhiêu)*
- [ ] Tải file mẫu `.csv`, `.xlsx`, `.txt`, `.docx` theo định chuẩn import ngân hàng câu hỏi
- [ ] UI tự luận/essay import để phát triển sau khi hoàn thiện trắc nghiệm

### Backend — Cấu hình bài kiểm tra & trắc nghiệm MVP cần bổ sung

- [x] Chuẩn hóa timezone bài kiểm tra: database lưu UTC, API trả `StartTime` / `EndTime` theo UTC rõ ràng để frontend không lệch giờ Việt Nam.
- [x] Đảm bảo backend kiểm tra thời gian mở/đóng đề bằng `DateTime.UtcNow` và cùng chuẩn UTC đã lưu.
- [x] Siết validation cấu hình exam: `DurationMinutes > 0`, `MaxAttempts > 0`, `EndTime > StartTime` khi có đủ hai mốc.
- [x] Siết điều kiện publish: đề phải có ít nhất một câu hỏi hợp lệ trước khi publish.
- [x] Validate publish cho `SingleChoice`: ít nhất 2 đáp án và đúng chính xác 1 đáp án đúng.
- [x] Validate publish cho `MultipleChoice`: ít nhất 2 đáp án và có ít nhất 1 đáp án đúng.
- [x] Validate publish cho `TrueFalse`: cố định/chuẩn hóa 2 đáp án Đúng/Sai và đúng chính xác 1 đáp án đúng.
- [x] Trả lỗi publish rõ ràng theo từng câu hỏi/cấu hình để frontend hiển thị được nguyên nhân.
- [x] Giữ `Question` / `Answer` gắn trực tiếp với `Exam` cho MVP; chưa triển khai `QuestionBank`, import file, chống trùng và batch import ở bước này.

### Frontend — Cấu hình bài kiểm tra & trắc nghiệm MVP cần bổ sung

- [x] Chuẩn hóa helper `datetime-local`: người dùng nhập giờ Việt Nam, gửi backend theo UTC, khi nhận API hiển thị lại đúng giờ Việt Nam.
- [x] Hiển thị nhãn rõ ràng cho lịch thi: `Theo giờ Việt Nam (UTC+7)`.
- [x] Tách UI cấu hình bài kiểm tra thành nhóm: thông tin cơ bản, lịch thi, cấu hình làm bài, giám sát.
- [x] Thay checkbox `Publish sau khi lưu` bằng hành động rõ ràng hơn: `Lưu nháp` và `Publish đề`.
- [x] Hiển thị trạng thái đủ/chưa đủ điều kiện publish trên trang chi tiết đề thi.
- [x] Chặn hoặc cảnh báo ở frontend khi cấu hình lịch thi/duration/max attempts không hợp lệ trước khi gửi API.
- [x] Hiển thị lỗi publish từ backend theo cách teacher biết cần sửa câu hỏi/cấu hình nào.
- [x] Ưu tiên UI quản lý câu hỏi trắc nghiệm trước: một đáp án, nhiều đáp án, đúng/sai; teacher có hướng dẫn theo loại câu hỏi và trang chi tiết đã thống kê đủ cả dạng tự luận ngắn mà backend đang hỗ trợ.
- [ ] Mở rộng question bank dùng lại giữa nhiều đề và import file ở bước sau.

**Tiêu chí hoàn thành:** Teacher cấu hình được đề trắc nghiệm theo giờ Việt Nam, publish được đề hợp lệ và Student bắt đầu làm bài đúng thời gian mở đề.

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

- [x] Màn hình làm bài *(student có route riêng `/student/attempts/:attemptId`, hỗ trợ start/resume, danh sách câu hỏi desktop/mobile, sidebar điều hướng rõ hơn, đánh số theo đúng thứ tự câu đã random và kết quả sau nộp gọn hơn theo setting của teacher)*
- [x] Countdown timer *(timer cố định trong header, cảnh báo khi còn ít thời gian)*
- [x] Auto submit khi hết giờ *(tự nộp khi đồng hồ về 0 và trả kết quả theo cấu hình đề thi)*
- [x] Fullscreen + anti-cheat theo cấu hình đề *(bật fullscreen bắt buộc khi teacher yêu cầu, ghi log tab switch / window blur / copy-paste / thoát fullscreen / reload / mất kết nối và vẫn đẩy realtime cho teacher qua luồng anti-cheat hiện có)*

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
- [x] Giám sát anti-cheat cho Admin *(đã thêm menu `Giám sát`, bộ lọc theo từ khóa/mức độ/loại vi phạm, bảng đề thi rủi ro, sinh viên cần chú ý và sự kiện gần đây; dữ liệu hiện tổng hợp từ mock admin dashboard source để phục vụ vận hành FE trước khi BE có endpoint admin riêng)*

**Tiêu chí hoàn thành:** Hệ thống ghi nhận hành vi bất thường và tính điểm nghi ngờ.

---

## Giai đoạn 8 — SignalR Realtime

**Mục tiêu:** Teacher nhận cảnh báo ngay khi student có hành vi bất thường.

- [x] `NotificationHub`
- [x] `ExamMonitoringHub`
- [x] Frontend kết nối SignalR
- [x] Backend gửi notification *(notifier realtime + listener; phần lưu notification vẫn thuộc Notification System riêng)*
- [x] Backend gửi anti-cheat warning
- [x] Teacher dashboard nhận cảnh báo realtime

**Tiêu chí hoàn thành:** Cảnh báo realtime hiển thị trên dashboard Teacher.

---

## Giai đoạn 9 — Redis

**Mục tiêu:** Giảm truy vấn SQL lặp trên luồng **thi + giám sát** (đã chạy Phase 6–8); lưu **presence** tạm thời (student còn online) không ghi DB mỗi 30 giây.

**Map feature:** `docs/features.md` → F-REDIS-01 … F-REDIS-06.

---

### Hiện trạng codebase (đã kiểm tra 2026-06-15)

| Hạng mục | Trạng thái | Ghi chú |
|----------|------------|---------|
| `StackExchange.Redis` 2.12.14 | ✅ Đã khai báo | `backend/EduGuard.Infrastructure/EduGuard.Infrastructure.csproj` |
| `ConnectionStrings:Redis` | ✅ Có mẫu | `backend/EduGuard.Api/appsettings.json` → `localhost:6379` |
| `ConnectionMultiplexer` / DI | ❌ Chưa có | `dependency-injection.cs` chưa đăng ký Redis |
| `Infrastructure/Redis/` | ❌ Chỉ `.gitkeep` | Chưa có `redis-cache-service.cs` |
| SignalR backplane | ❌ Chưa | Hubs chạy in-process (`NotificationHub`, `ExamMonitoringHub`) |
| SQL source of truth | ✅ | `ExamRepository`, `CheatingLogRepository` — Redis **không** thay persistence |

**Điểm nóng hiện tại (mỗi request đều hit DB):**

| Luồng | Code | Vấn đề |
|-------|------|--------|
| Teacher mở chi tiết đề | FE `ExamDetailPage` → `examApi.getQuestions` + `antiCheatApi.getExamSummary` | 2 round-trip; summary join attempts + logs |
| `GET /api/exams/{id}/questions` | `ExamService.GetQuestionsAsync` → `GetByIdWithDetailsAsync` | Load cả Exam + Questions + Answers + Setting dù chỉ cần list câu hỏi |
| `GET /api/anti-cheat/exams/{id}/summary` | `AntiCheatService.GetExamSummaryAsync` | `GetAttemptsByExamIdAsync` + `GetByExamIdAsync` (logs), group in-memory |
| Student làm bài | `ExamAttemptService.GetAttemptAsync` | **Không cache** — shuffle theo `ExamShuffleHelper`, đáp án đúng ẩn theo attempt |
| Presence online | Chưa có | FE chỉ gửi anti-cheat log (`DISCONNECTED`, `PAGE_RELOAD`…); teacher không biết attempt còn “sống” nếu không có log |

---

### Phạm vi Phase 9 (IN) vs để sau (OUT)

**Làm trong phase này (MVP Redis):**

- Cache-aside **question bank** (teacher/admin) — UC-1
- Cache TTL ngắn **anti-cheat summary** — UC-2
- **Heartbeat + presence** Hash theo attempt — UC-3
- `Redis:Enabled=false` → `NullCacheService` / no-op presence (dev không bắt buộc chạy Redis)
- Graceful degradation: Redis down → log warning, fallback DB

**Không làm trong phase này:**

| Hạng mục | Lý do |
|----------|--------|
| SignalR Redis backplane | Chỉ cần khi ≥ 2 instance API |
| Cache `GetByClassroomAsync`, dashboard Phase 10 | API dashboard BE chưa có |
| Cache JWT blacklist / refresh token | Auth đủ MVP |
| Lưu draft đáp án Redis | `SaveAnswerAsync` đã persist `StudentAnswer` SQL |
| Distributed lock `StartAsync` | `GetInProgressAttemptAsync` + DB đủ MVP |
| Rate limit API bằng Redis | Chưa yêu cầu |

---

### Nguyên tắc thiết kế

1. **Cache-aside:** `GET` cache → miss → DB → `SET`; mọi mutation **invalidate** (hoặc `SET` lại) — không write-through phức tạp.
2. **Key namespace:** `{InstanceName}:` prefix, mặc định `eduguard:` (config `Redis:InstanceName`).
3. **Serialize:** `System.Text.Json` — cùng shape DTO API (`QuestionDto`, `ExamAntiCheatSummaryDto`).
4. **Cấu trúc Redis:** String (JSON) cho cache; Hash cho presence; Set phụ cho index presence theo exam (tùy chọn UC-3b).
5. **Không cache dữ liệu đã shuffle / theo attempt** — chỉ cache “question bank gốc” của đề.
6. **Invalidation rõ ràng** — tập trung helper `ExamCacheInvalidator` (hoặc method trên `ICacheService`) tránh quên khi thêm API câu hỏi.

---

### Sơ đồ luồng (cache-aside — UC-1)

```txt
Client GET /exams/{id}/questions
    → ExamService.GetQuestionsAsync
        → ICacheService.GetAsync<List<QuestionDto>>("eduguard:exam:{id}:questions")
            HIT  → return
            MISS → ExamRepository.GetByIdWithDetailsAsync
                 → map QuestionDto[]
                 → SetAsync (TTL 30 phút)
                 → return
```

```txt
Teacher POST /exams/{id}/questions (hoặc PUT/DELETE question/answer)
    → ExamService.*Async
        → SaveChanges SQL
        → ICacheService.RemoveAsync("eduguard:exam:{id}:questions")
```

---

### Bảng key Redis (chuẩn dự án)

| Key | Kiểu | TTL | Payload / field | Ghi chú |
|-----|------|-----|-----------------|--------|
| `eduguard:exam:{examId}:questions` | String (JSON) | 30 phút hoặc none + invalidate | `QuestionDto[]` đủ `Answers` | UC-1; **có đáp án đúng** — chỉ teacher/admin qua auth |
| `eduguard:exam:{examId}:anticheat:summary` | String (JSON) | 45 giây | `ExamAntiCheatSummaryDto` | UC-2; `FlaggedAttempts` threshold = 10 (`AntiCheatService`) |
| `eduguard:attempt:{attemptId}:presence` | Hash | 120s sliding | `studentId`, `examId`, `lastSeenUtc`, `client` | UC-3 |
| `eduguard:exam:{examId}:presence:attempts` | Set | không TTL riêng | member = `attemptId` | UC-3b tùy chọn — index để teacher list online |

**Lệnh Redis tham chiếu (presence):**

```txt
HSET eduguard:attempt:42:presence studentId "..." examId "7" lastSeenUtc "2026-06-15T10:00:00Z" client "web"
EXPIRE eduguard:attempt:42:presence 120
SADD eduguard:exam:7:presence:attempts 42
```

---

### Ma trận invalidate cache câu hỏi (UC-1)

Mọi thao tác sau **phải** `RemoveAsync(eduguard:exam:{examId}:questions)` sau `SaveChangesAsync` thành công:

| Service method | File | `examId` lấy từ |
|----------------|------|-----------------|
| `UpdateAsync` | `exam-service.cs` | tham số |
| `PatchAsync` | `exam-service.cs` | tham số |
| `DeleteAsync` | `exam-service.cs` | tham số (+ xóa luôn summary key) |
| `PublishAsync` | `exam-service.cs` | tham số |
| `AddQuestionAsync` | `exam-service.cs` | tham số |
| `UpdateQuestionAsync` | `exam-service.cs` | `question.ExamId` |
| `PatchQuestionAsync` | `exam-service.cs` | `question.ExamId` |
| `DeleteQuestionAsync` | `exam-service.cs` | `question.ExamId` |
| `AddAnswerAsync` | `exam-service.cs` | `question.ExamId` |
| `UpdateAnswerAsync` | `exam-service.cs` | `answer.Question.ExamId` |
| `PatchAnswerAsync` | `exam-service.cs` | `answer.Question.ExamId` |

**Không invalidate từ:** `GetQuestionsAsync`, `GetByIdAsync`, `StartAsync`, `SaveAnswerAsync`, `LogAsync` (chỉ đọc hoặc không đổi question bank).

---

### Ma trận invalidate / TTL summary (UC-2)

| Sự kiện | Hành vi đề xuất |
|---------|------------------|
| `GetExamSummaryAsync` | Đọc cache; miss → query DB như hiện tại → set TTL 45s |
| `LogAsync` (sau persist + SignalR) | `RemoveAsync` summary key **hoặc** chỉ rely TTL (MVP: **remove** để teacher thấy score mới ngay khi reload REST) |
| `SubmitAsync` attempt | Không bắt buộc invalidate summary (TTL ngắn đủ); có thể remove nếu muốn chính xác tức thì |
| `DeleteAsync` exam | Remove summary key |

---

### Artifact cần tạo (file mới)

**Application layer:**

| File | Nội dung |
|------|----------|
| `Application/Services/Interfaces/i-cache-service.cs` | `GetAsync<T>`, `SetAsync<T>`, `RemoveAsync`, `RemoveByPrefixAsync` (optional) |
| `Application/Services/Interfaces/i-attempt-presence-service.cs` | `TouchAsync(attemptId, studentId, examId, ct)`, `RemoveAsync(attemptId)`, `GetByExamAsync(examId)` |
| `Application/Redis/redis-key-names.cs` | `ExamQuestions(examId)`, `ExamAntiCheatSummary(examId)`, `AttemptPresence(attemptId)`, `ExamPresenceIndex(examId)` |
| `Application/Options/redis-options.cs` | Bind section `Redis` |

**Infrastructure layer:**

| File | Nội dung |
|------|----------|
| `Infrastructure/Redis/redis-cache-service.cs` | `ICacheService` — `IDatabase.StringGet/Set`, JSON, try/catch → null on failure |
| `Infrastructure/Redis/null-cache-service.cs` | No-op khi `Redis:Enabled=false` |
| `Infrastructure/Redis/redis-attempt-presence-service.cs` | Hash + EXPIRE + Set index |
| `Infrastructure/Redis/exam-cache-invalidator.cs` | `InvalidateExamQuestionsAsync`, `InvalidateExamAntiCheatSummaryAsync` — inject vào Exam/AntiCheat services |

---

### Artifact cần sửa (file hiện có)

| File | Thay đổi |
|------|----------|
| `Infrastructure/dependency-injection.cs` | `AddSingleton<IConnectionMultiplexer>`, `AddScoped<ICacheService>`, `AddScoped<IAttemptPresenceService>`, bind `RedisOptions` |
| `Infrastructure/Exams/exam-service.cs` | Inject `ICacheService` + invalidator; bọc `GetQuestionsAsync`; gọi invalidate ở bảng trên |
| `Infrastructure/AntiCheat/anti-cheat-service.cs` | Bọc `GetExamSummaryAsync`; `RemoveAsync` summary trong `LogAsync` |
| `Infrastructure/Exams/exam-attempt-service.cs` | `SubmitAsync` → `presence.RemoveAsync`; (tùy chọn) `StartAsync` → touch presence |
| `Api/Controllers/exam-attempts-controller.cs` | `POST api/attempts/{id}/heartbeat` |
| `Api/appsettings.json` | Thêm section `Redis` (xem mẫu 9.0) |
| `Api/Program.cs` | (Tùy chọn) `AddHealthChecks().AddRedis(...)` |

**Frontend:**

| File | Thay đổi |
|------|----------|
| `frontend/src/api/examAttemptApi.js` | `sendHeartbeat(attemptId)` |
| `frontend/src/features/exam-attempts/pages/ExamAttemptPage.jsx` | `setInterval` 30s gọi heartbeat khi `status === InProgress`; clear on submit/unmount |
| `frontend/src/features/anti-cheat/components/AttemptMonitorPanel.jsx` | (Tùy chọn) badge “Online” nếu BE trả `isOnline` / API presence |
| `frontend/src/api/antiCheatApi.js` | (Tùy chọn) `getExamPresence(examId)` nếu thêm `GET` cho teacher |

---

### Cấu hình (`appsettings.json` — bổ sung)

```json
"Redis": {
  "Enabled": true,
  "InstanceName": "eduguard",
  "QuestionCacheMinutes": 30,
  "AntiCheatSummarySeconds": 45,
  "PresenceTtlSeconds": 120,
  "AbortOnConnectFail": false
}
```

- `ConnectionStrings:Redis` giữ `localhost:6379` (dev).
- Production: password qua `localhost:6379,password=***` — **không** commit secret.
- `AbortOnConnectFail: false` để API vẫn start khi Redis chưa bật (degrade).

---

### 9.0 — Môi trường & smoke test

- [ ] Chạy Redis local: `docker run -d --name eduguard-redis -p 6379:6379 redis:7-alpine`
- [ ] Smoke: `redis-cli PING` → `PONG`; `SET eduguard:smoke 1` / `GET`
- [x] Xác nhận `appsettings.json` có `ConnectionStrings:Redis` (đã có) + section `Redis` như trên
- [ ] Document trong `docs/02_SETUP_AND_PROJECT_STRUCTURE.md` (mục Redis) nếu lệnh Docker khác README — **chỉ khi dev hỏi setup**

### 9.1 — Hạ tầng DI & abstraction

- [x] Tạo `ICacheService` + `RedisCacheService` + `NullCacheService` (F-REDIS-02)
- [x] Tạo `redis-key-names.cs` — không hardcode string trong service
- [x] Đăng ký `ConnectionMultiplexer.Connect(configuration["ConnectionStrings:Redis"])` **singleton** trong `dependency-injection.cs` (F-REDIS-01)
- [x] Đọc `Redis:Enabled` — false → đăng ký `NullCacheService`
- [x] Log `Information` khi connect OK; `Warning` khi operation fail (không throw ra controller)
- [ ] (Tùy chọn) Health check `/health` tag `redis`

### 9.2 — UC-1: Cache question bank

- [x] Bọc `ExamService.GetQuestionsAsync` — key `eduguard:exam:{examId}:questions`
- [x] Sau auth (`RequireAccessibleExamAsync` + `EnsureQuestionBankAccess`) mới trả cache — student không có quyền question bank vẫn 403 như cũ
- [x] Implement invalidate đủ ma trận (11 method `exam-service.cs`)
- [x] `DeleteAsync` exam: remove cả `questions` + `anticheat:summary` keys
- [ ] Verify FE `ExamDetailPage` / `examApi.getQuestions` — teacher sửa câu hỏi → reload thấy data mới

### 9.3 — UC-2: Cache anti-cheat summary

- [x] Bọc `AntiCheatService.GetExamSummaryAsync` — TTL `AntiCheatSummarySeconds`
- [x] `LogAsync`: sau `SaveChangesAsync` + `SendAntiCheatWarningAsync`, gọi `InvalidateExamAntiCheatSummaryAsync(examId)`
- [ ] Giữ nguyên authorization: chỉ `exam.TeacherId == teacherId`
- [ ] SignalR realtime **không** thay REST summary — cache giảm tải khi teacher refresh trang

### 9.4 — UC-3: Heartbeat & presence

**Backend**

- [x] Tạo `IAttemptPresenceService` + `RedisAttemptPresenceService` (F-REDIS-05)
- [x] `POST /api/attempts/{attemptId}/heartbeat` — `[Authorize(Roles = Student)]`, attempt `InProgress`, owner đúng `studentId`
- [x] Body optional: `{ "client": "web" }` — lưu vào Hash
- [x] `ExamAttemptService.SubmitAsync` → `RemoveAsync(attemptId)` + `SREM` exam index
- [ ] (Tùy chọn) `GET /api/exams/{examId}/presence` — Teacher owner — trả `attemptId[]` còn TTL

**Frontend**

- [x] `examAttemptApi.sendHeartbeat(attemptId)` — gọi mỗi **30s** trong `ExamAttemptPage` (cùng lifecycle anti-cheat, `visibilitychange` pause khi tab hidden nếu muốn tiết kiệm)
- [x] Dừng interval khi submit / unmount / `status !== InProgress`
- [ ] (Tùy chọn) `AttemptMonitorPanel`: hiển thị “Đang online” khi attempt ∈ presence set

### 9.5 — Kiểm thử *(để sau — không chặn 9.0–9.4)*

> Thực hiện khi implementation xong; không ghi vào tiêu chí “hoàn thành phase” lúc này.

- [ ] Manual: mở Redis CLI `MONITOR` — thấy GET/SET questions khi reload `ExamDetailPage`
- [ ] Manual: sửa câu hỏi → key questions bị DEL → GET miss → DB
- [ ] Manual: gửi anti-cheat log → summary key invalidate hoặc TTL hết → `flaggedAttempts` khớp DB
- [ ] Manual: heartbeat → TTL refresh; submit → key biến mất
- [ ] Redis tắt, `Enabled=true` → API vẫn 200 (degrade)
- [x] `dotnet test` pass

---

### Tiêu chí hoàn thành (triển khai)

1. Teacher reload trang chi tiết đề **ít query SQL hơn** (cache questions + summary).
2. Student làm bài **không** đổi hành vi shuffle / lưu đáp án.
3. Redis tắt → hệ thống vẫn chạy (degrade).
4. Có ít nhất một đường presence (heartbeat) để teacher biết attempt còn online.
5. Không thêm Redis chỉ để “có trong stack” — mỗi key map tới bảng use case trên.

**Rủi ro / lưu ý:**

- Cache `questions` chứa `IsCorrect` — **không** expose cho student (đã chặn bởi `EnsureQuestionBankAccess`).
- Stale cache nếu quên invalidate — ưu tiên `ExamCacheInvalidator` gọi tập trung.
- Phase 11 Docker sẽ thêm container Redis — connection string đồng bộ `docker-compose` sau.


---

## Giai đoạn 10 — Dashboard & Reporting

**Mục tiêu:** Trang tổng quan cho Admin, Teacher, Student.

- [x] API dashboard Admin *(Tổng hợp trực tiếp từ các API backend thật của user, classroom, exam, attempt, anti-cheat)*
- [x] API dashboard Teacher *(Tổng hợp trực tiếp từ các API backend thật của classroom, assignment, exam, attempt, anti-cheat)*
- [x] API dashboard Student *(Tổng hợp trực tiếp từ các API backend thật của classroom, exam, assignment)*
- [x] Thống kê số lớp, học sinh, bài tập, điểm thi *(Đã kết nối dữ liệu thật)*
- [x] Thống kê cheating score *(Đã kết nối dữ liệu thật)*
- [x] Frontend dashboard Admin *(UI tổng quan người dùng, lớp học, activity, anti-cheat đã giữ nguyên bố cục title-only; dữ liệu dashboard admin hiện tổng hợp từ API backend thật của user/classroom/exam/attempt/anti-cheat thay cho mock, nên số liệu lớp học, bài kiểm tra và lượt làm cần chú ý đã khớp hơn với database; điều hướng `Giám sát` vẫn giữ nguyên)*
- [x] Frontend dashboard Teacher *(đã có mock API + UI lớp quản lý, nộp bài, lịch thi, sinh viên rủi ro cao, proctoring streams placeholder; thiết kế thanh điều hướng Nav bar chuyên nghiệp; block stat/timeline/metric đã bỏ mô tả phụ)*
- [x] Teacher shell + reporting workspace theo `docs/ui_tech.md` *(sidebar Teacher nay đủ `Dashboard / Lớp học / Bài tập / Đề thi / Giám sát thi / Kết quả / Thông báo / Hồ sơ`; top bar đã có search thật + quick-create; bổ sung các page teacher cho assignment center, exam monitoring, result reporting, notification list; classroom detail của Teacher đã có workspace tab `Tổng quan / Học sinh / Bài tập / Bài thi / Kết quả / Hoạt động`)*
- [x] Frontend dashboard Student *(mock page cũ vẫn còn trong codebase để tham chiếu, nhưng đã gỡ khỏi menu và route công khai của Student; Student hiện dùng `Lớp của tôi` làm điểm vào chính và tập trung vào classroom, bài kiểm tra, hồ sơ)*
- [x] Frontend biểu đồ dashboard *(tích hợp thư viện Recharts để vẽ trực quan Classroom Performance và Anti-cheat Incidents)*

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

## Giai đoạn 12 — Live Proctoring Control Room

**Mục tiêu:** Giáo viên giám sát live camera học sinh trong lúc thi — lobby trước giờ, WebRTC, control room, bằng chứng, AI YOLO proxy.

**Branch:** `feat/live-proctoring-control-room` · Spec: `plans/monitoring_camera/EduGuard_Live_Proctoring_Control_Room_Spec.md` · Merge devB: `docs/proctoring-devB-integration.md`

### Phase 0 — Chuẩn bị & data model

- [x] Mở rộng `ExamSetting` (~20 field proctoring)
- [x] Entity: `LiveProctoringSession`, `ProctoringEvidence`, `ProctoringState`, `ProctorAction`, `ExamProctorAssignment`, `ProctoringAiSettings`
- [x] `ExamAttemptStatus.PausedByProctor`
- [x] Migration `AddLiveProctoringEntities`
- [x] Redis key naming (`proctoring:watch-lock`, lobby cache)

### Phase 1 — API skeleton & services

- [x] `ProctoringController` (room, states, detail, actions)
- [x] Services: `ProctoringService`, `ExamLobbyService`, `StudentProctoringService`, `LiveProctoringService`, `ProctoringActionService`
- [x] DTOs + validators cơ bản
- [x] Static files `wwwroot/uploads/proctoring`

### Phase 2 — Student lobby & camera

- [x] `ExamLobbyPage` — vào phòng chờ trước `StartTime`
- [x] `StudentDeviceCheckPage` — kiểm tra camera/mic
- [x] Camera preview + watermark trên `ExamAttemptPage`
- [x] Proctoring heartbeat + `RequiresAutoSnapshot`
- [x] `ExamPausedPage` khi `PausedByProctor`

### Phase 3 — WebRTC signaling

- [x] Mở rộng `ExamMonitoringHub` (offer/answer/ICE, không tạo hub mới)
- [x] `ProctoringSignalingService` + Redis watch lock (1 watcher / học sinh)
- [x] `useStudentWebRtcPublisher` (student = offerer)
- [x] `useTeacherWebRtcViewer` (teacher = answerer)
- [ ] E2E verify WebRTC qua mạng thật (2 máy / NAT)

### Phase 4 — Teacher Control Room UI

- [x] `TeacherProctoringRoomPage` — grid + drawer
- [x] Co-proctor panel (`ExamProctorAssignment`)
- [x] Link từ `TeacherMonitoringPage` / `ExamDetailPage`
- [x] Tile grid hiển thị live video khi đang watch (`remoteStream` trên `StudentLiveTile`)
- [x] Pause / resume / warn / terminate + `ProctoringReasonDialog`
- [x] SignalR control events (`StudentMovedToWaitingRoom`, …)
- [ ] Responsive polish mobile/tablet cho control room
- [ ] Multi-tile live đồng thời (hiện 1 active watch / drawer)

### Phase 5 — Evidence

- [x] Upload snapshot (teacher manual + student auto)
- [x] Lưu local `wwwroot/uploads/proctoring/{examId}/{attemptId}/`
- [x] Manual clip recording (MediaRecorder → upload `Clip`)
- [ ] Playback timeline đồng bộ với anti-cheat log trên UI
- [ ] Dọn file cũ / retention policy

### Phase 6 — Policy engine & realtime warnings

- [x] `ProctoringPolicyService` — suspicion score, risk level
- [x] Auto snapshot qua heartbeat policy
- [x] `ReceiveProctoringWarning` SignalR
- [x] CheatingLog `WEBCAM_OFF` khi camera tắt (heartbeat)
- [x] CheatingLog `TAB_SWITCH` khi thoát fullscreen; `DISCONNECTED` khi mất/ không ổn định kết nối
- [x] CheatingLog cho AI flag (`PHONE_VISIBLE`, `BOOK_VISIBLE`, …)
- [ ] Teacher notification toast đồng bộ với anti-cheat dashboard

### Phase 7 — YOLO AI proxy

- [x] `ai-services/proctoring-ai-service` (FastAPI + Ultralytics stub)
- [x] `POST /api/attempts/{id}/proctoring/detect` proxy
- [x] Admin `ProctoringAiSettings` (`/admin/proctoring-ai`)
- [x] `useProctoringAutoDetection` loop phía student
- [x] Bounding box metadata lưu vào `ProctoringEvidence.Metadata`
- [x] CheatingLog cho AI flag (`PHONE_VISIBLE`, `BOOK_VISIBLE`, …)
- [ ] Cài Ultralytics + model production trên server AI
- [ ] Tune ngưỡng confidence theo môi trường thi thật

### Phase 8 — Docs, QA, tích hợp

- [x] `CHANGELOG.md`, `docs/project-changelog.md`, `docs/apiList.md` §12
- [x] `docs/proctoring-devB-integration.md`
- [x] `docs/features.md` — F-FUT-01 đánh dấu v1
- [x] `npm run lint` sạch cho module proctoring (`src/features/proctoring`, `proctoringApi.js`)
- [ ] Smoke E2E: lobby → thi → live watch → pause → evidence
- [x] Merge / rebase lên `devD` hoặc `release` (tránh conflict devB question bank) — `devD` sync `origin/release` @ `f01399c`

**Tiêu chí hoàn thành (v1):** Học sinh bật camera trước giờ thi → làm bài với heartbeat → giáo viên xem live, chụp/ghi clip, tạm dừng/cảnh báo → AI gợi ý gian lận lưu evidence + CheatingLog.

**Còn lại trước production:** E2E WebRTC, deploy AI service, merge nhánh dev, QA checklist proctoring.

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

## Tài liệu — README giới thiệu hệ thống

**Mục tiêu:** README là cổng vào repo — giới thiệu hệ thống làm gì, cấu trúc ra sao, cách chạy, điểm nổi bật. **Không** ghi tiến độ phase (để `Todo List.md`, `CHANGELOG.md`, `docs/project-changelog.md`, `docs/features.md`).

**Rà soát hiện trạng (2026-06-15):**

| File | Vấn đề |
|------|--------|
| `README.md` (root) | ✅ Đã cấu hình lại (2026-06-15) — giới thiệu hệ thống, không tiến độ phase |
| `docs/README.md` | ✅ Đã bổ sung phân vai README vs tiến độ, điểm nổi bật, hướng đọc |
| `frontend/README.md` | ✅ Đã thay template Vite bằng README EduGuard |
| `backend/README.md` | ✅ Đã tạo |

**Nguyên tắc nội dung README:**

- **Có:** mục đích hệ thống, vai trò user, tech stack, kiến trúc tóm tắt, cấu trúc thư mục, hướng dẫn chạy local, điểm nổi bật / cải tiến, link sang `docs/` chi tiết
- **Không:** bảng tiến độ phase, checkbox giai đoạn, "đang làm / chưa bắt đầu" — trỏ sang `Todo List.md`

### Root `README.md`

- [x] Gỡ hoặc rút gọn mục **Trạng thái dự án** / **Lộ trình** — thay bằng 1 dòng link `Todo List.md` cho tiến độ
- [x] Cập nhật **Tính năng** → mô tả capability (LMS, thi online, anti-cheat, SignalR…), không bảng % hoàn thành
- [x] Thêm **Điểm nổi bật** (Clean Architecture 4 layer, Identity+JWT, giám sát thi realtime, exam attempt + timer, anti-cheat scoring…)
- [x] Cập nhật **Tech stack** — bỏ "dự kiến" cho phần đã có (React/Vite/Tailwind, EF Core, SQL Server, SignalR)
- [x] Cập nhật **Cấu trúc thư mục** — `frontend/` đã là app Vite đầy đủ; liệt kê module backend chính
- [x] Cập nhật **Cài đặt / Chạy** — `dotnet run` backend + `npm run dev` frontend, URL Swagger & Vite
- [x] Thêm **Kiến trúc tóm tắt** (ASCII hoặc link `docs/03_BACKEND_ARCHITECTURE.md`, `docs/01_PROJECT_OVERVIEW.md`)
- [x] Giữ **Phát triển** (nhánh, commit, workflow) — không trùng nội dung tiến độ feature

### `docs/README.md`

- [x] Thêm mục **README vs tài liệu tiến độ** (README = giới thiệu; `Todo List` / `features.md` / `apiList.md` = checklist)
- [x] Bổ sung **Điểm nổi bật hệ thống** (tóm tắt 5–8 bullet, không phase status)
- [x] Cập nhật **Cách đọc nhanh** — dev mới vs đọc sâu kiến trúc/API

### `frontend/README.md`

- [x] Thay template Vite bằng README EduGuard frontend
- [x] Vai trò SPA, stack (React, Vite, Tailwind, Axios, SignalR client)
- [x] Cấu trúc `src/` (`features/`, `api/`, `signalr/`, `hooks/`, theme)
- [x] `npm install`, `npm run dev`, `npm run build`; proxy/CORS với backend
- [x] Link `docs/design-guidelines.md`, `docs/05_API_FRONTEND_INTEGRATION.md`
- [x] Không ghi tiến độ phase

### `backend/README.md` (tạo mới)

- [x] Tạo file — giới thiệu solution 4 project (Api, Application, Domain, Infrastructure)
- [x] Sơ đồ layer `Controller → Service → Repository → DbContext`
- [x] `dotnet run`, migration EF, connection string SQL Server / Redis
- [x] Module chính: Auth, Classroom, Assignment, Exam, Attempt, AntiCheat, SignalR hubs
- [x] Link `docs/03_BACKEND_ARCHITECTURE.md`, `docs/02_SETUP_AND_PROJECT_STRUCTURE.md`

**Tiêu chí hoàn thành:** Dev mới đọc README (root + frontend/backend) hiểu hệ thống, chạy được local, biết điểm nổi bật — không cần đọc Todo List để hiểu sản phẩm là gì.

---

## Kiểm thử hệ thống (QA)

Checklist thực hiện & giám sát — **master** + **16 file chi tiết** (~1.116 TC):

- [ ] [`docs/test-checklists/eduguard-system-test-checklist.md`](docs/test-checklists/eduguard-system-test-checklist.md) — master (tiến độ + smoke + sign-off)
- [ ] [`docs/test-checklists/README.md`](docs/test-checklists/README.md) — mục lục đầy đủ

**File chi tiết theo module:**

- [ ] [`system-infrastructure-system-test-checklist.md`](docs/test-checklists/system-infrastructure-system-test-checklist.md) — §0 System (50 TC)
- [ ] [`database-entity-system-test-checklist.md`](docs/test-checklists/database-entity-system-test-checklist.md) — §1 Database (56 TC)
- [ ] [`authentication-system-test-checklist.md`](docs/test-checklists/authentication-system-test-checklist.md) — §2 Auth (85 TC)
- [ ] [`user-management-system-test-checklist.md`](docs/test-checklists/user-management-system-test-checklist.md) — §3 User (62 TC)
- [ ] [`classroom-system-test-checklist.md`](docs/test-checklists/classroom-system-test-checklist.md) — §4 Classroom (79 TC)
- [ ] [`assignment-system-test-checklist.md`](docs/test-checklists/assignment-system-test-checklist.md) — §5 Assignment (78 TC)
- [ ] [`exam-management-system-test-checklist.md`](docs/test-checklists/exam-management-system-test-checklist.md) — §6 Exam (88 TC)
- [ ] [`exam-attempt-system-test-checklist.md`](docs/test-checklists/exam-attempt-system-test-checklist.md) — §7 Attempt (95 TC)
- [ ] [`anti-cheat-system-test-checklist.md`](docs/test-checklists/anti-cheat-system-test-checklist.md) — §8 Anti-cheat (73 TC)
- [ ] [`notification-system-test-checklist.md`](docs/test-checklists/notification-system-test-checklist.md) — §9 Notification (58 TC)
- [ ] [`dashboard-reporting-system-test-checklist.md`](docs/test-checklists/dashboard-reporting-system-test-checklist.md) — §10 Dashboard (78 TC)
- [ ] [`signalr-realtime-system-test-checklist.md`](docs/test-checklists/signalr-realtime-system-test-checklist.md) — §11 SignalR (67 TC)
- [ ] [`redis-cache-system-test-checklist.md`](docs/test-checklists/redis-cache-system-test-checklist.md) — §12 Redis (60 TC)
- [ ] [`logging-activity-system-test-checklist.md`](docs/test-checklists/logging-activity-system-test-checklist.md) — §13 Logging (49 TC)
- [ ] [`docker-deploy-system-test-checklist.md`](docs/test-checklists/docker-deploy-system-test-checklist.md) — §14 Docker (58 TC)
- [ ] [`cross-cutting-system-test-checklist.md`](docs/test-checklists/cross-cutting-system-test-checklist.md) — §X Cross-cutting (80 TC)

- [ ] Smoke hệ thống (mục cuối file master) trước mỗi build
- [ ] Cập nhật bảng tiến độ + defect log sau mỗi phiên QA

---

## Hướng phát triển (ngoài MVP)

- ~~AI Proctoring~~ → **v1 Live Control Room** (Giai đoạn 12, đang hoàn thiện E2E)
- Facial Recognition
- AI Auto Grading
- Mobile App
- Multi-school Management
- Advanced Learning Analytics
- Cloud Deployment
