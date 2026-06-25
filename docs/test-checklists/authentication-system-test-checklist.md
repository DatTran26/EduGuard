# Authentication & Authorization — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§2 Authentication**  
> Module: **Phase 2** · `F-AUTH-*` · JWT + Refresh Token  
> Cập nhật: 2026-06-15  
> API: `POST /api/auth/register|login|refresh-token|logout` · `GET /api/auth/me`

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Môi trường | ⬜ Local · ⬜ Staging |
| Test accounts | Admin / Teacher / Student |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 10 | | | | | |
| 2. Positive | 6 | | | | | |
| 3. Negative | 10 | | | | | |
| 4. BVA | 6 | | | | | |
| 5. Equivalence | 5 | | | | | |
| 6. Edge cases | 6 | | | | | |
| 7. Security | 8 | | | | | |
| 8. Error handling | 5 | | | | | |
| 9. API | 6 | | | | | |
| 10. Database | 4 | | | | | |
| 11. E2E | 5 | | | | | |
| 12. Non-functional | 4 | | | | | |
| 13. Regression | 4 | | | | | |
| 14. Exploratory | 3 | | | | | |
| 15. Concurrency | 3 | | | | | |
| **Tổng** | **85** | | | | | |

---

## 1. Functional Testing

- [ ] **AUTH-FUNC-001** · P1 · Auto · Register → user + role Student mặc định
- [ ] **AUTH-FUNC-002** · P1 · Auto · Login → accessToken + refreshToken
- [ ] **AUTH-FUNC-003** · P1 · Auto · `GET /api/auth/me` → id, email, roles, fullName
- [ ] **AUTH-FUNC-004** · P1 · Auto · Refresh → access token mới, refresh rotate (nếu có)
- [ ] **AUTH-FUNC-005** · P1 · Auto · Logout → refresh revoked
- [ ] **AUTH-FUNC-006** · P1 · FE Login form → redirect dashboard theo role
- [ ] **AUTH-FUNC-007** · P1 · FE Register → success → login hoặc auto-login
- [ ] **AUTH-FUNC-008** · P1 · FE Protected routes Admin / Teacher / Student
- [ ] **AUTH-FUNC-009** · P2 · FE Axios interceptor gắn Bearer
- [ ] **AUTH-FUNC-010** · P2 · FE persist token (memory/localStorage policy đúng)

---

## 2. Positive Testing

- [ ] **AUTH-POS-001** · P1 · Auto · Register valid → 201/200
- [ ] **AUTH-POS-002** · P1 · Auto · Login valid → 200 + tokens
- [ ] **AUTH-POS-003** · P1 · Auto · Me với valid token → 200
- [ ] **AUTH-POS-004** · P1 · Auto · Refresh valid → new access
- [ ] **AUTH-POS-005** · P1 · Logout rồi refresh cùng token → fail
- [ ] **AUTH-POS-006** · P2 · Login fullName unicode tiếng Việt

---

## 3. Negative Testing

- [ ] **AUTH-NEG-001** · P1 · Auto · Register email trùng → 400
- [ ] **AUTH-NEG-002** · P1 · Auto · Login sai password → 401
- [ ] **AUTH-NEG-003** · P1 · Auto · Login email không tồn tại → 401
- [ ] **AUTH-NEG-004** · P1 · Auto · Refresh invalid/revoked → 401
- [ ] **AUTH-NEG-005** · P1 · Auto · Protected API không Bearer → 401
- [ ] **AUTH-NEG-006** · P1 · Student route `/admin/*` → redirect/403
- [ ] **AUTH-NEG-007** · P1 · Teacher route `/admin/*` → redirect/403
- [ ] **AUTH-NEG-008** · P2 · Register password quá ngắn → 400 + message
- [ ] **AUTH-NEG-009** · P2 · Register email invalid format → 400
- [ ] **AUTH-NEG-010** · P2 · Me với expired access → 401

---

## 4. Boundary Value Analysis (BVA)

- [ ] **AUTH-BVA-001** · P2 · Password đúng độ dài tối thiểu Identity
- [ ] **AUTH-BVA-002** · P2 · Password max length / special chars
- [ ] **AUTH-BVA-003** · P2 · Email max length 256
- [ ] **AUTH-BVA-004** · P2 · fullName rỗng vs 1 ký tự vs max
- [ ] **AUTH-BVA-005** · P3 · Refresh token expiry boundary
- [ ] **AUTH-BVA-006** · P3 · Access token expiry — refresh trong grace window

---

## 5. Equivalence Partitioning

- [ ] **AUTH-EQ-001** · P1 · Partition role Admin — menu admin visible
- [ ] **AUTH-EQ-002** · P1 · Partition role Teacher
- [ ] **AUTH-EQ-003** · P1 · Partition role Student
- [ ] **AUTH-EQ-004** · P2 · Partition: locked user cannot login
- [ ] **AUTH-EQ-005** · P2 · Partition: unconfirmed email (nếu có) blocked

---

## 6. Edge Cases

- [ ] **AUTH-EDGE-001** · P1 · Đổi role user DB → `/me` hoặc re-login sync
- [ ] **AUTH-EDGE-002** · P2 · Concurrent login 2 devices — refresh chain
- [ ] **AUTH-EDGE-003** · P2 · Logout device A — device B refresh behavior
- [ ] **AUTH-EDGE-004** · P2 · Register ngay sau delete user cùng email
- [ ] **AUTH-EDGE-005** · P2 · Tab đóng không logout — token expiry path
- [ ] **AUTH-EDGE-006** · P3 · Clock skew server/client JWT

---

## 7. Security Testing

- [ ] **AUTH-SEC-001** · P1 · Auto · JWT tampering signature → 401
- [ ] **AUTH-SEC-002** · P1 · Password không trong response body
- [ ] **AUTH-SEC-003** · P1 · Refresh token hash DB, không plaintext
- [ ] **AUTH-SEC-004** · P1 · Không log password trong Serilog/console
- [ ] **AUTH-SEC-005** · P2 · Brute force login — rate limit (nếu có)
- [ ] **AUTH-SEC-006** · P2 · SQL injection trong login email field
- [ ] **AUTH-SEC-007** · P2 · XSS trong fullName khi hiển thị profile
- [ ] **AUTH-SEC-008** · P2 · Token trong URL query chỉ SignalR — không leak referrer

---

## 8. Error Handling

- [ ] **AUTH-ERR-001** · P2 · FE toast lỗi đăng nhập rõ (sai MK / email)
- [ ] **AUTH-ERR-002** · P1 · Token hết hạn mid-session → auto refresh hoặc login
- [ ] **AUTH-ERR-003** · P2 · Refresh fail → clear storage + redirect login
- [ ] **AUTH-ERR-004** · P2 · BE 500 register — không leak stack trace
- [ ] **AUTH-ERR-005** · P2 · Network offline login — message thân thiện

---

## 9. API Testing

- [ ] **AUTH-API-001** · P1 · Auto · Contract login response fields
- [ ] **AUTH-API-002** · P1 · Auto · Contract `/me` schema
- [ ] **AUTH-API-003** · P2 · Auto · Register 400 validation problem details
- [ ] **AUTH-API-004** · P2 · Auto · Login latency p95 < 500ms
- [ ] **AUTH-API-005** · P2 · Content-Type application/json required
- [ ] **AUTH-API-006** · P3 · Idempotent logout 2 lần

---

## 10. Database Validation

- [ ] **AUTH-DB-001** · P1 · User row sau register trong AspNetUsers
- [ ] **AUTH-DB-002** · P1 · RefreshToken row sau login
- [ ] **AUTH-DB-003** · P1 · Logout set revoked/expiry refresh
- [ ] **AUTH-DB-004** · P2 · UserRoles có Student sau register

---

## 11. End-to-End Testing

- [ ] **AUTH-E2E-001** · P1 · Register → login → me → logout → me fail
- [ ] **AUTH-E2E-002** · P1 · Teacher login → classroom page accessible
- [ ] **AUTH-E2E-003** · P1 · Student login → không vào exam builder teacher
- [ ] **AUTH-E2E-004** · P2 · Session refresh trong 30 phút active use
- [ ] **AUTH-E2E-005** · P2 · Deep link protected → login → redirect back

---

## 12. Non-functional Testing

- [ ] **AUTH-NFR-001** · P2 · Login page LCP acceptable
- [ ] **AUTH-NFR-002** · P2 · Form accessibility labels + keyboard
- [ ] **AUTH-NFR-003** · P3 · 100 login/min không degrade local
- [ ] **AUTH-NFR-004** · P3 · Mobile width login usable

---

## 13. Regression Testing

- [ ] **AUTH-REG-001** · P1 · Sau đổi CORS — login vẫn OK
- [ ] **AUTH-REG-002** · P1 · Sau thêm module mới — guards không break
- [ ] **AUTH-REG-003** · P2 · Interceptor không double Bearer
- [ ] **AUTH-REG-004** · P2 · Husky commit — auth tests pass

---

## 14. Exploratory Testing

- [ ] **AUTH-EXP-001** · P2 · Charter: User quên đang login — logout path rõ
- [ ] **AUTH-EXP-002** · P2 · Charter: Copy-paste password có space thừa
- [ ] **AUTH-EXP-003** · P3 · Charter: Back button sau logout

---

## 15. Concurrency & Exception

- [ ] **AUTH-CON-001** · P2 · 2 tab cùng refresh — một success một fail gracefully
- [ ] **AUTH-CON-002** · P3 · Parallel register same email — một success
- [ ] **AUTH-CON-003** · P2 · SQL restart during login — no corrupt token

---

## Smoke tối thiểu

- [ ] AUTH-FUNC-002 · Login
- [ ] AUTH-FUNC-003 · Me
- [ ] AUTH-FUNC-008 · Route guards
- [ ] AUTH-NEG-002 · Wrong password
- [ ] AUTH-SEC-001 · JWT tamper

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
- `docs/apiList.md` § Authentication
