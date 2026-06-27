# User Management — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§3 User Management**  
> Module: **Phase 3** · `F-USER-*`  
> Cập nhật: 2026-06-15  
> Trạng thái: ⬜ BE Users API · FE profile từ `/api/auth/me`

**API (planned):** `GET/PUT /api/users` · `PATCH lock/unlock`

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Admin account | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 8 | | | | | |
| 2. Positive | 5 | | | | | |
| 3. Negative | 7 | | | | | |
| 4. BVA | 4 | | | | | |
| 5. Equivalence | 4 | | | | | |
| 6. Edge cases | 4 | | | | | |
| 7. Security | 5 | | | | | |
| 8. Error handling | 3 | | | | | |
| 9. API | 5 | | | | | |
| 10. Database | 3 | | | | | |
| 11. E2E | 4 | | | | | |
| 12. Non-functional | 3 | | | | | |
| 13. Regression | 3 | | | | | |
| 14. Exploratory | 2 | | | | | |
| 15. Concurrency | 2 | | | | | |
| **Tổng** | **62** | | | | | |

---

## 1. Functional Testing

- [ ] **USER-FUNC-001** · P2 · ⬜ BE · `GET /api/users` Admin paginated list
- [ ] **USER-FUNC-002** · P2 · ⬜ BE · `GET /api/users/{id}` Admin detail
- [ ] **USER-FUNC-003** · P2 · ⬜ BE · `PUT /api/users/{id}` owner update profile
- [ ] **USER-FUNC-004** · P2 · ⬜ BE · Admin `PUT` đổi role user
- [ ] **USER-FUNC-005** · P2 · ⬜ BE · `PATCH .../lock` Admin
- [ ] **USER-FUNC-006** · P2 · ⬜ BE · `PATCH .../unlock` Admin
- [ ] **USER-FUNC-007** · P2 · FE profile page load từ `/api/auth/me`
- [ ] **USER-FUNC-008** · P3 · FE avatar upload preview (mock) không crash

---

## 2. Positive Testing

- [ ] **USER-POS-001** · P2 · ⬜ Admin list users page 1 size 20
- [ ] **USER-POS-002** · P2 · User sửa fullName own profile → 200
- [ ] **USER-POS-003** · P2 · Admin lock → user login fail
- [ ] **USER-POS-004** · P2 · Admin unlock → login OK
- [ ] **USER-POS-005** · P3 · Search/filter user by email (nếu có)

---

## 3. Negative Testing

- [ ] **USER-NEG-001** · P1 · Student `GET /api/users` → 403
- [ ] **USER-NEG-002** · P2 · User A sửa profile User B → 403
- [ ] **USER-NEG-003** · P2 · Teacher lock user → 403
- [ ] **USER-NEG-004** · P2 · `GET /api/users/{invalid-guid}` → 404
- [ ] **USER-NEG-005** · P2 · Lock admin cuối cùng → 400 (nếu rule)
- [ ] **USER-NEG-006** · P2 · PUT invalid email format → 400
- [ ] **USER-NEG-007** · P2 · Unauthenticated list users → 401

---

## 4. Boundary Value Analysis (BVA)

- [ ] **USER-BVA-001** · P3 · fullName empty string
- [ ] **USER-BVA-002** · P3 · fullName max length
- [ ] **USER-BVA-003** · P3 · Pagination page=0, size=0, size=1000
- [ ] **USER-BVA-004** · P3 · Last page partial results

---

## 5. Equivalence Partitioning

- [ ] **USER-EQ-001** · P2 · Partition Admin — full user CRUD
- [ ] **USER-EQ-002** · P2 · Partition Teacher — read-only users denied
- [ ] **USER-EQ-003** · P2 · Partition Student — self profile only
- [ ] **USER-EQ-004** · P2 · Partition locked vs active user login

---

## 6. Edge Cases

- [ ] **USER-EDGE-001** · P2 · Admin đổi role self — không mất quyền đột ngột
- [ ] **USER-EDGE-002** · P2 · User đang online bị lock — session invalidate
- [ ] **USER-EDGE-003** · P3 · Delete user có classroom ownership
- [ ] **USER-EDGE-004** · P3 · Profile update concurrent 2 tabs

---

## 7. Security Testing

- [ ] **USER-SEC-001** · P1 · API không trả password hash
- [ ] **USER-SEC-002** · P1 · IDOR: Student không GET user id khác
- [ ] **USER-SEC-003** · P2 · Admin không escalate self via API tamper
- [ ] **USER-SEC-004** · P2 · Mass assignment — không set IsAdmin field trực tiếp
- [ ] **USER-SEC-005** · P2 · Audit log lock/unlock (khi có logging)

---

## 8. Error Handling

- [ ] **USER-ERR-001** · P2 · FE profile save fail — toast
- [ ] **USER-ERR-002** · P2 · List users BE 500 — empty state
- [ ] **USER-ERR-003** · P3 · Optimistic UI rollback on fail

---

## 9. API Testing

- [ ] **USER-API-001** · P2 · ⬜ Contract list response pagination meta
- [ ] **USER-API-002** · P2 · ⬜ Contract user detail schema
- [ ] **USER-API-003** · P2 · PUT partial vs full body behavior
- [ ] **USER-API-004** · P3 · Sort order stable
- [ ] **USER-API-005** · P3 · ETag / concurrency token (nếu có)

---

## 10. Database Validation

- [ ] **USER-DB-001** · P2 · Lock flag persisted AspNetUsers
- [ ] **USER-DB-002** · P2 · Role change reflected UserRoles
- [ ] **USER-DB-003** · P3 · Profile update UpdatedAt

---

## 11. End-to-End Testing

- [ ] **USER-E2E-001** · P2 · Admin đổi role → user refresh → menu đúng
- [ ] **USER-E2E-002** · P2 · Student edit profile → me reflects
- [ ] **USER-E2E-003** · P2 · Lock user mid-session → next API 401
- [ ] **USER-E2E-004** · P3 · Admin list → open detail → lock

---

## 12. Non-functional Testing

- [ ] **USER-NFR-001** · P3 · List 10k users pagination perf
- [ ] **USER-NFR-002** · P3 · Profile page a11y
- [ ] **USER-NFR-003** · P3 · Mobile profile form

---

## 13. Regression Testing

- [ ] **USER-REG-001** · P2 · `/me` vẫn OK khi Users API chưa có
- [ ] **USER-REG-002** · P2 · Auth register không break
- [ ] **USER-REG-003** · P3 · Avatar mock không leak memory

---

## 14. Exploratory Testing

- [ ] **USER-EXP-001** · P3 · Charter: Admin tìm user nhanh trong 1000 rows
- [ ] **USER-EXP-002** · P3 · Charter: Student hiểu profile vs account settings

---

## 15. Concurrency & Exception

- [ ] **USER-CON-001** · P3 · Admin lock + user login simultaneous
- [ ] **USER-CON-002** · P3 · Two admins edit same user

---

## Smoke tối thiểu

- [ ] USER-FUNC-007 · Profile from /me
- [ ] USER-NEG-001 · Student no list
- [ ] USER-SEC-001 · No password hash

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|

---

## Sign-off

| QA | | | ⬜ Pass · ⬜ Fail · ⬜ Blocked (BE pending) |

---

## Liên kết

- [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md)
