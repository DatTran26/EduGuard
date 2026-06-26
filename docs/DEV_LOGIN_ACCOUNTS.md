# Tài khoản dev — đăng nhập local

> **Chỉ dùng môi trường dev.** Mật khẩu chung cho tất cả tài khoản bên dưới.  
> Seed lại: `dotnet run --project backend/scripts/SeedDevUsers`

## Đăng nhập web

- URL: **[http://localhost:5173/login](http://localhost:5173/login)**
- Mật khẩu (tất cả): `**Test@12345`**

## Danh sách tài khoản


| Vai trò   | Email                    | Mật khẩu     | Ghi chú                                          |
| --------- | ------------------------ | ------------ | ------------------------------------------------ |
| Admin     | `admin@eduguard.test`    | `Test@12345` | Quản lý user, cấu hình AI `/admin/proctoring-ai`, **mở phòng giám sát live** mọi đề thi |
| Giáo viên | `teacher1@eduguard.test` | `Test@12345` | Tạo lớp, đề, phòng giám sát live                 |
| Giáo viên | `teacher2@eduguard.test` | `Test@12345` | Tài khoản GV dự phòng                            |
| Sinh viên | `student1@eduguard.test` | `Test@12345` | Test làm bài / camera                            |
| Sinh viên | `student2@eduguard.test` | `Test@12345` | Test làm bài / camera                            |
| Sinh viên | `student3@eduguard.test` | `Test@12345` | Test làm bài / camera                            |


## Swagger (API)

- URL: **[http://localhost:5157/swagger](http://localhost:5157/swagger)**
- `POST /api/auth/login` → body:

```json
{
  "email": "teacher1@eduguard.test",
  "password": "Test@12345"
}
```

- Copy `data.accessToken` → **Authorize** → `Bearer <token>`

## Luồng test nhanh

1. **teacher1** — tạo lớp, đề, bật giám sát live, publish
2. **student1/2/3** — tham gia lớp → lobby → làm bài
3. **teacher1** — `/teacher/exams/{examId}/proctoring`
4. **admin** — `/admin/proctoring-ai` (URL AI: `http://127.0.0.1:8800`); mở phòng giám sát: `/admin/exams/{examId}/proctoring` (hoặc nút **Mở phòng giám sát live** ở chi tiết đề `/admin/exams/{examId}`)

Chi tiết E2E: `[dev-test-proctoring-e2e.md](dev-test-proctoring-e2e.md)`

## Redis (không cần Docker)

- **Redis Insight** chỉ là app xem/quản lý — không phải server.
- Nếu đã có **Redis Cloud** (vd. alias `redis-eduguard` trong Insight), API dùng cùng connection string trong `appsettings.json` → `ConnectionStrings:Redis`.
- **Không** cần `docker run redis` trừ khi muốn Redis chạy trên máy (`localhost:6379`).
- Khi chạy `dotnet run`, log có `Redis connection established.` là OK.
- Trong Insight, filter key: `eduguard:`*

