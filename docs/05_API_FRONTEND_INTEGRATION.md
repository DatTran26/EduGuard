# 05. API và tích hợp Frontend - Backend

## 1. Mục tiêu tài liệu

Tài liệu này mô tả cách frontend ReactJS tương tác với backend ASP.NET Core Web API trong hệ thống EduGuard.

Các nội dung chính:

- Quy ước API endpoint.
- Quy ước request / response.
- Cách dùng Axios.
- Cách gắn JWT token.
- Cách xử lý SignalR realtime.
- Luồng tích hợp các module chính.

## 2. Nguyên tắc tổng thể

Frontend không truy cập trực tiếp SQL Server.

Luồng đúng là:

```txt
ReactJS Frontend
        ↓ HTTP / SignalR
ASP.NET Core Web API
        ↓ EF Core
SQL Server
```

Frontend chỉ giao tiếp với backend thông qua:

```txt
REST API
SignalR Hub
```

## 3. Quy ước API URL

Backend chạy local ví dụ:

```txt
https://localhost:7234
```

API base URL:

```txt
https://localhost:7234/api
```

SignalR base URL:

```txt
https://localhost:7234/hubs
```

Frontend `.env`:

```env
VITE_API_BASE_URL=https://localhost:7234/api
VITE_SIGNALR_URL=https://localhost:7234/hubs
```

## 4. Quy ước response chung

Nên thống nhất response dạng:

```json
{
  "success": true,
  "message": "Thao tác thành công.",
  "data": {}
}
```

Khi lỗi:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ.",
  "errors": []
}
```

Ví dụ tạo lớp thành công:

```json
{
  "success": true,
  "message": "Tạo lớp học thành công.",
  "data": {
    "id": 1,
    "name": "Lớp 12A1",
    "joinCode": "A1B2C3"
  }
}
```

## 5. API Authentication

### 5.1. Đăng ký

```txt
POST /api/auth/register
```

Request:

```json
{
  "fullName": "Nguyen Van A",
  "email": "student@gmail.com",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Đăng ký thành công.",
  "data": {
    "id": 1,
    "fullName": "Nguyen Van A",
    "email": "student@gmail.com"
  }
}
```

### 5.2. Đăng nhập

```txt
POST /api/auth/login
```

Request:

```json
{
  "email": "student@gmail.com",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Đăng nhập thành công.",
  "data": {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": 1,
      "fullName": "Nguyen Van A",
      "email": "student@gmail.com",
      "roles": ["Student"]
    }
  }
}
```

## 6. Axios Client

File: `frontend/src/api/axiosClient.js`

```js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
```

## 7. API file theo module frontend

Cấu trúc:

```txt
src/api/
├── axiosClient.js
├── authApi.js
├── classroomApi.js
├── assignmentApi.js
├── examApi.js
├── antiCheatApi.js
└── notificationApi.js
```

Ví dụ `authApi.js`:

```js
import axiosClient from "./axiosClient";

export const authApi = {
  login: (data) => axiosClient.post("/auth/login", data),
  register: (data) => axiosClient.post("/auth/register", data),
  refreshToken: (data) => axiosClient.post("/auth/refresh-token", data),
};
```

Ví dụ `classroomApi.js`:

```js
import axiosClient from "./axiosClient";

export const classroomApi = {
  getAll: () => axiosClient.get("/classrooms"),
  getById: (id) => axiosClient.get(`/classrooms/${id}`),
  create: (data) => axiosClient.post("/classrooms", data),
  join: (joinCode) => axiosClient.post("/classrooms/join", { joinCode }),
  removeMember: (classroomId, studentId) =>
    axiosClient.delete(`/classrooms/${classroomId}/members/${studentId}`),
};
```

## 8. API route đề xuất

### 8.1. Auth

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout
GET  /api/auth/me
```

### 8.2. Users

```txt
GET    /api/users
GET    /api/users/{id}
PUT    /api/users/{id}
PATCH  /api/users/{id}/lock
PATCH  /api/users/{id}/unlock
```

### 8.3. Classrooms

```txt
GET    /api/classrooms
GET    /api/classrooms/{id}
POST   /api/classrooms
PUT    /api/classrooms/{id}
DELETE /api/classrooms/{id}
POST   /api/classrooms/join
GET    /api/classrooms/{id}/members
DELETE /api/classrooms/{id}/members/{studentId}
```

### 8.4. Assignments

```txt
GET    /api/classrooms/{classroomId}/assignments
GET    /api/assignments/{id}
POST   /api/classrooms/{classroomId}/assignments
PUT    /api/assignments/{id}
DELETE /api/assignments/{id}
POST   /api/assignments/{id}/submit
GET    /api/assignments/{id}/submissions
POST   /api/submissions/{id}/grade
```

### 8.5. Exams

```txt
GET    /api/classrooms/{classroomId}/exams
GET    /api/exams/{id}
POST   /api/classrooms/{classroomId}/exams
PUT    /api/exams/{id}
DELETE /api/exams/{id}
POST   /api/exams/{id}/publish
POST   /api/exams/{id}/questions
PUT    /api/questions/{id}
DELETE /api/questions/{id}
POST   /api/questions/{id}/answers
```

### 8.6. Exam Attempt

```txt
POST /api/exams/{examId}/start
GET  /api/attempts/{attemptId}
POST /api/attempts/{attemptId}/answers
POST /api/attempts/{attemptId}/submit
GET  /api/exams/{examId}/attempts
GET  /api/attempts/{attemptId}/result
```

### 8.7. Anti-cheat

```txt
POST /api/anti-cheat/logs
GET  /api/anti-cheat/attempts/{attemptId}/logs
GET  /api/anti-cheat/attempts/{attemptId}/score
GET  /api/anti-cheat/exams/{examId}/summary
```

### 8.8. Notifications

```txt
GET   /api/notifications
PATCH /api/notifications/{id}/read
PATCH /api/notifications/read-all
```

### 8.9. Dashboard

```txt
GET /api/dashboard/admin
GET /api/dashboard/teacher
GET /api/dashboard/student
```

> Danh sách đầy đủ endpoint + checkbox triển khai: [`apiList.md`](apiList.md)

## 9. JWT flow trong frontend

SPA React **không** dùng cookie đăng nhập của Identity. Mọi request protected gửi JWT qua header `Authorization`.

Luồng:

```txt
User login
    ↓
Backend trả accessToken + refreshToken
    ↓
Frontend lưu token
    ↓
Axios tự gắn Authorization header
    ↓
Backend kiểm tra token
    ↓
Cho phép hoặc từ chối request
```

Header:

```txt
Authorization: Bearer <accessToken>
```

## 10. SignalR Integration

### 10.1. Hub backend đề xuất

```txt
/hubs/notifications
/hubs/exam-monitoring
```

### 10.2. NotificationHub

Dùng cho:

- Thông báo deadline.
- Thông báo điểm.
- Thông báo lớp học.

Frontend lắng nghe:

```js
connection.on("ReceiveNotification", (notification) => {
  console.log(notification);
});
```

### 10.3. ExamMonitoringHub

Dùng cho:

- Cảnh báo anti-cheat realtime.
- Theo dõi học sinh đang làm bài.
- Countdown realtime nếu cần.

Frontend giáo viên lắng nghe:

```js
connection.on("ReceiveAntiCheatWarning", (warning) => {
  console.log("Anti-cheat warning", warning);
});
```

## 11. Luồng anti-cheat từ frontend

Frontend bắt sự kiện:

```js
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    antiCheatApi.log({
      examAttemptId: currentAttemptId,
      type: "TAB_SWITCH",
      description: "Học sinh chuyển tab trong khi làm bài"
    });
  }
});
```

API:

```js
export const antiCheatApi = {
  log: (data) => axiosClient.post("/anti-cheat/logs", data),
};
```

Backend xử lý:

```txt
AntiCheatController
    ↓
AntiCheatService
    ↓
CheatingLogRepository
    ↓
SignalR gửi warning cho Teacher
```

## 12. Luồng làm bài thi từ frontend

```txt
Student bấm Start
    ↓
POST /api/exams/{examId}/start
    ↓
Nhận attemptId + questions
    ↓
Frontend hiển thị bài thi
    ↓
Student chọn đáp án
    ↓
POST /api/attempts/{attemptId}/answers
    ↓
Hết giờ hoặc bấm Submit
    ↓
POST /api/attempts/{attemptId}/submit
    ↓
Nhận kết quả
```

## 13. Swagger dùng để làm gì?

Swagger là giao diện tài liệu và test API của backend.

Dùng để:

- Xem danh sách endpoint.
- Test API nhanh.
- Biết request body cần gửi.
- Biết response backend trả về.
- Hỗ trợ frontend tích hợp dễ hơn.

URL (Development, profile `https`):

```txt
https://localhost:7168/swagger
```

**Hướng dẫn chi tiết:** [`swagger-api-testing-guide.md`](swagger-api-testing-guide.md) — đăng nhập JWT, gán role Teacher, luồng Classroom → Assignment → Exam → Attempt.

## 14. Quy tắc tích hợp frontend/backend

- Backend phải bật CORS cho `http://localhost:5173`.
- Frontend phải cấu hình đúng `VITE_API_BASE_URL`.
- API cần đăng nhập phải gửi JWT token.
- Không lưu dữ liệu nhạy cảm trong localStorage nếu triển khai thật.
- Trong đồ án, localStorage có thể chấp nhận để đơn giản.
- SignalR URL phải trùng với endpoint backend map.

