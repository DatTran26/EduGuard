# Database & Entity — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§1 Database**  
> Module: **Phase 1** · EF Core · SQL Server `EduGuardExam`  
> Cập nhật: 2026-06-15

**Cách dùng:** Kiểm tra schema, migration, seed, integrity. Dùng SSMS / `sqlcmd` / EF migrations.

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| DB Server | |
| Database | `EduGuardExam` |
| Migration version | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 8 | | | | | |
| 2. Positive | 4 | | | | | |
| 3. Negative | 4 | | | | | |
| 4. BVA | 3 | | | | | |
| 5. Equivalence | 3 | | | | | |
| 6. Edge cases | 4 | | | | | |
| 7. Security | 3 | | | | | |
| 8. Error handling | 2 | | | | | |
| 9. API | 2 | | | | | |
| 10. Database | 12 | | | | | |
| 11. E2E | 2 | | | | | |
| 12. Non-functional | 3 | | | | | |
| 13. Regression | 2 | | | | | |
| 14. Exploratory | 2 | | | | | |
| 15. Concurrency | 2 | | | | | |
| **Tổng** | **56** | | | | | |

---

## 1. Functional Testing

- [ ] **DB-FUNC-001** · P1 · DB `EduGuardExam` tồn tại sau `dotnet ef database update`
- [ ] **DB-FUNC-002** · P1 · Roles seeded: Admin, Teacher, Student
- [ ] **DB-FUNC-003** · P1 · Identity tables: AspNetUsers, Roles, UserRoles, RefreshTokens
- [ ] **DB-FUNC-004** · P1 · Domain: Classrooms, ClassroomMembers, Exams, Questions, Answers
- [ ] **DB-FUNC-005** · P1 · Attempt domain: ExamAttempts, StudentAnswers, CheatingLogs
- [ ] **DB-FUNC-006** · P1 · Assignment domain: Assignments, Submissions
- [ ] **DB-FUNC-007** · P2 · Mỗi entity có PK, CreatedAt/UpdatedAt (nếu có)
- [ ] **DB-FUNC-008** · P2 · Enum columns map đúng (AttemptStatus, CheatingType, …)

---

## 2. Positive Testing

- [ ] **DB-POS-001** · P1 · Insert user + classroom + exam qua API → rows xuất hiện
- [ ] **DB-POS-002** · P1 · Seed admin account login được (nếu có seed)
- [ ] **DB-POS-003** · P2 · Transaction commit — data persist sau restart BE
- [ ] **DB-POS-004** · P2 · Unicode tiếng Việt trong NVARCHAR lưu/đọc đúng

---

## 3. Negative Testing

- [ ] **DB-NEG-001** · P1 · FK violation (member classroomId sai) → reject insert
- [ ] **DB-NEG-002** · P1 · Unique JoinCode duplicate → reject
- [ ] **DB-NEG-003** · P2 · NOT NULL column thiếu → reject
- [ ] **DB-NEG-004** · P2 · Delete parent có FK restrict → error hoặc cascade đúng rule

---

## 4. Boundary Value Analysis (BVA)

- [ ] **DB-BVA-001** · P2 · String max length: classroom name, exam title
- [ ] **DB-BVA-002** · P2 · Score decimal boundary 0, maxScore
- [ ] **DB-BVA-003** · P2 · DateTime UTC boundary startTime = endTime

---

## 5. Equivalence Partitioning

- [ ] **DB-EQ-001** · P2 · Partition AttemptStatus: InProgress vs Submitted
- [ ] **DB-EQ-002** · P2 · Partition Member role Active vs Removed
- [ ] **DB-EQ-003** · P2 · Partition Exam published vs draft

---

## 6. Edge Cases

- [ ] **DB-EDGE-001** · P2 · Orphan question sau xóa exam — rule cascade
- [ ] **DB-EDGE-002** · P2 · Soft delete vs hard delete (nếu có)
- [ ] **DB-EDGE-003** · P3 · Empty DB — first migration only
- [ ] **DB-EDGE-004** · P2 · Re-run migration idempotent

---

## 7. Security Testing

- [ ] **DB-SEC-001** · P1 · DB user app chỉ quyền cần thiết (không sa)
- [ ] **DB-SEC-002** · P1 · Connection string không trong git
- [ ] **DB-SEC-003** · P2 · Password hash AspNetUsers — không plaintext

---

## 8. Error Handling

- [ ] **DB-ERR-001** · P1 · BE khi SQL down → startup fail / health rõ
- [ ] **DB-ERR-002** · P2 · Deadlock retry hoặc 500 có message

---

## 9. API Testing

- [ ] **DB-API-001** · P2 · API create entity → verify row bằng query độc lập
- [ ] **DB-API-002** · P2 · API delete → row gone / soft-deleted đúng

---

## 10. Database Validation (chi tiết)

- [ ] **DB-VAL-001** · P1 · `__EFMigrationsHistory` khớp codebase
- [ ] **DB-VAL-002** · P1 · Index trên ClassroomId, ExamId, AttemptId FK
- [ ] **DB-VAL-003** · P1 · RefreshToken hash unique
- [ ] **DB-VAL-004** · P2 · JoinCode unique index
- [ ] **DB-VAL-005** · P2 · CheatingLogs.AttemptId FK
- [ ] **DB-VAL-006** · P2 · StudentAnswers unique (AttemptId, QuestionId)
- [ ] **DB-VAL-007** · P2 · COUNT members = API list length
- [ ] **DB-VAL-008** · P2 · Attempt score column sau submit populated
- [ ] **DB-VAL-009** · P3 · Statistics update sau bulk insert
- [ ] **DB-VAL-010** · P2 · Collation phù hợp tiếng Việt
- [ ] **DB-VAL-011** · P3 · Backup/restore script documented
- [ ] **DB-VAL-012** · P3 · Migration rollback tested on dev

---

## 11. End-to-End Testing

- [ ] **DB-E2E-001** · P1 · Full journey tạo data qua UI → query DB verify
- [ ] **DB-E2E-002** · P2 · Drop DB → migrate → seed → smoke login

---

## 12. Non-functional Testing

- [ ] **DB-NFR-001** · P2 · Query list classrooms < 500ms với 1k rows
- [ ] **DB-NFR-002** · P3 · Index usage trên attempt list (execution plan)
- [ ] **DB-NFR-003** · P3 · DB size growth estimate sau 1 semester mock data

---

## 13. Regression Testing

- [ ] **DB-REG-001** · P1 · Migration mới không break existing data
- [ ] **DB-REG-002** · P2 · Sau thêm column nullable — old rows OK

---

## 14. Exploratory Testing

- [ ] **DB-EXP-001** · P2 · Charter: Tìm FK thiếu bằng cách xóa aggressive
- [ ] **DB-EXP-002** · P3 · Charter: Data anomaly sau concurrent submit

---

## 15. Concurrency & Exception

- [ ] **DB-CON-001** · P2 · 2 students submit cùng attempt window — no duplicate attempt
- [ ] **DB-CON-002** · P2 · Concurrent grade same submission — last write wins / lock

---

## Smoke tối thiểu

- [ ] DB-FUNC-001 · DB exists
- [ ] DB-FUNC-002 · Roles seeded
- [ ] DB-VAL-001 · Migrations applied

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|

---

## Sign-off

| QA | | | ⬜ Pass · ⬜ Fail |

---

## Liên kết

- [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md)
