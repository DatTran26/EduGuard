# EduGuard — Test Checklists

Checklist kiểm thử hệ thống (system testing) — **master** theo dõi tiến độ; **file con** chứa từng test case cụ thể (functional, negative, BVA, security, E2E, …).

**Bắt đầu tại:** [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md)

**Tham chiếu:** [`../../api/api-list.md`](../../api/api-list.md) · [`../../api/features.md`](../../api/features.md) · [`../../../Todo List.md`](../../../Todo%20List.md)

**Quy ước:** P1 = bắt buộc trước release · `Auto` = ứng viên tự động hóa · `⬜ BE` = chưa có API/backend

---

## Master

| File | Vai trò |
|------|---------|
| [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) | Tiến độ 16 module · smoke · defect log · sign-off |

---

## File chi tiết theo module (~1.116 TC)

| § | Module | File | TC |
|---|--------|------|-----|
| 0 | System / Infra | [`system-infrastructure-system-test-checklist.md`](system-infrastructure-system-test-checklist.md) | 50 |
| 1 | Database & Entity | [`database-entity-system-test-checklist.md`](database-entity-system-test-checklist.md) | 56 |
| 2 | Authentication | [`authentication-system-test-checklist.md`](authentication-system-test-checklist.md) | 85 |
| 3 | User Management | [`user-management-system-test-checklist.md`](user-management-system-test-checklist.md) | 62 |
| 4 | Classroom | [`classroom-system-test-checklist.md`](classroom-system-test-checklist.md) | 79 |
| 5 | Assignment | [`assignment-system-test-checklist.md`](assignment-system-test-checklist.md) | 78 |
| 6 | Exam Management | [`exam-management-system-test-checklist.md`](exam-management-system-test-checklist.md) | 88 |
| 7 | Exam Attempt | [`exam-attempt-system-test-checklist.md`](exam-attempt-system-test-checklist.md) | 95 |
| 8 | Anti-cheat | [`anti-cheat-system-test-checklist.md`](anti-cheat-system-test-checklist.md) | 73 |
| 9 | Notification | [`notification-system-test-checklist.md`](notification-system-test-checklist.md) | 58 |
| 10 | Dashboard | [`dashboard-reporting-system-test-checklist.md`](dashboard-reporting-system-test-checklist.md) | 78 |
| 11 | SignalR Realtime | [`signalr-realtime-system-test-checklist.md`](signalr-realtime-system-test-checklist.md) | 67 |
| 12 | Redis Cache | [`redis-cache-system-test-checklist.md`](redis-cache-system-test-checklist.md) | 60 |
| 13 | Logging & Activity | [`logging-activity-system-test-checklist.md`](logging-activity-system-test-checklist.md) | 49 |
| 14 | Docker / Deploy | [`docker-deploy-system-test-checklist.md`](docker-deploy-system-test-checklist.md) | 58 |
| X | Cross-cutting | [`cross-cutting-system-test-checklist.md`](cross-cutting-system-test-checklist.md) | 80 |

---

## Cấu trúc mỗi file con (giống Dashboard)

1. Thông tin phiên kiểm thử  
2. Tiến độ theo **15 nhóm** kiểm thử (Functional → Concurrency)  
3. Checkbox từng TC: `ID · Priority · Auto? · Mô tả`  
4. Smoke subset module  
5. Defect log + Sign-off  
6. Liên kết master + module liên quan  

---

## Workflow QA đề xuất

1. Chạy **Smoke hệ thống** (cuối file master) mỗi build  
2. Chọn module → mở file con → đánh dấu từng TC  
3. Cập nhật bảng tiến độ module trên master  
4. Ghi defect vào file con hoặc defect log master  
