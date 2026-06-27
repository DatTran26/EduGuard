# Classroom Management — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§4 Classroom**  
> Module: **Phase 4** · `F-CLS-*` · 8/8 API ✓  
> API: `/api/classrooms` · join · members (`docs/api/api-list.md` API-CLS-*)

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Teacher / Student accounts | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 12 | | | | | |
| 2. Positive | 6 | | | | | |
| 3. Negative | 8 | | | | | |
| 4. BVA | 5 | | | | | |
| 5. Equivalence | 4 | | | | | |
| 6. Edge cases | 6 | | | | | |
| 7. Security | 5 | | | | | |
| 8. Error handling | 4 | | | | | |
| 9. API | 6 | | | | | |
| 10. Database | 4 | | | | | |
| 11. E2E | 5 | | | | | |
| 12. Non-functional | 4 | | | | | |
| 13. Regression | 4 | | | | | |
| 14. Exploratory | 3 | | | | | |
| 15. Concurrency | 3 | | | | | |
| **Tổng** | **79** | | | | | |

---

## 1. Functional Testing

- [ ] **CLS-FUNC-001** · P1 · Auto · Teacher `POST /api/classrooms` → JoinCode
- [ ] **CLS-FUNC-002** · P1 · Auto · `GET /api/classrooms` scoped teacher/student
- [ ] **CLS-FUNC-003** · P1 · Auto · `GET /api/classrooms/{id}` detail
- [ ] **CLS-FUNC-004** · P1 · Auto · Student `POST .../join` valid code
- [ ] **CLS-FUNC-005** · P1 · Auto · Teacher `GET .../members`
- [ ] **CLS-FUNC-006** · P2 · Teacher `PUT` full update name/description
- [ ] **CLS-FUNC-007** · P2 · Teacher `PATCH` partial update
- [ ] **CLS-FUNC-008** · P2 · Teacher `DELETE .../members/{studentId}`
- [ ] **CLS-FUNC-009** · P2 · Teacher `DELETE /api/classrooms/{id}`
- [ ] **CLS-FUNC-010** · P1 · FE create classroom + show/copy JoinCode
- [ ] **CLS-FUNC-011** · P1 · FE student join by code
- [ ] **CLS-FUNC-012** · P2 · FE classroom list cards + navigation detail

---

## 2. Positive Testing

- [ ] **CLS-POS-001** · P1 · Auto · Create → response có id + joinCode
- [ ] **CLS-POS-002** · P1 · Auto · Join → member row + student sees class
- [ ] **CLS-POS-003** · P1 · Auto · Members list count đúng
- [ ] **CLS-POS-004** · P2 · PATCH chỉ name — description giữ nguyên
- [ ] **CLS-POS-005** · P2 · Teacher sees only own classrooms
- [ ] **CLS-POS-006** · P2 · Student sees joined classrooms only

---

## 3. Negative Testing

- [ ] **CLS-NEG-001** · P1 · Auto · Student `POST /api/classrooms` → 403
- [ ] **CLS-NEG-002** · P1 · Auto · Join invalid code → 400/404
- [ ] **CLS-NEG-003** · P1 · Auto · Student view members lớp không thuộc → 403
- [ ] **CLS-NEG-004** · P1 · Auto · Teacher B edit/delete lớp Teacher A → 403
- [ ] **CLS-NEG-005** · P2 · Join lại khi đã member → 409 hoặc idempotent 200
- [ ] **CLS-NEG-006** · P2 · Student remove member → 403
- [ ] **CLS-NEG-007** · P2 · GET classroom id random GUID → 404
- [ ] **CLS-NEG-008** · P2 · Empty body create → 400

---

## 4. Boundary Value Analysis (BVA)

- [ ] **CLS-BVA-001** · P2 · JoinCode length min/max, case sensitivity
- [ ] **CLS-BVA-002** · P2 · Name empty vs 1 char vs max length
- [ ] **CLS-BVA-003** · P2 · Description null vs very long text
- [ ] **CLS-BVA-004** · P3 · Classroom với 0 members — list OK
- [ ] **CLS-BVA-005** · P3 · Max members per class (nếu có limit)

---

## 5. Equivalence Partitioning

- [ ] **CLS-EQ-001** · P1 · Partition Teacher owner — full CRUD
- [ ] **CLS-EQ-002** · P1 · Partition Student member — read + join
- [ ] **CLS-EQ-003** · P2 · Partition non-member — no access
- [ ] **CLS-EQ-004** · P2 · Partition Admin — policy đúng (read all hoặc deny)

---

## 6. Edge Cases

- [ ] **CLS-EDGE-001** · P2 · Delete classroom có exams/assignments — cascade/block
- [ ] **CLS-EDGE-002** · P2 · Remove student đang có attempt in-progress
- [ ] **CLS-EDGE-003** · P2 · JoinCode collision regenerate (nếu có)
- [ ] **CLS-EDGE-004** · P2 · Teacher delete self from members — denied
- [ ] **CLS-EDGE-005** · P3 · Unicode classroom name hiển thị FE
- [ ] **CLS-EDGE-006** · P3 · Copy join code clipboard permission browser

---

## 7. Security Testing

- [ ] **CLS-SEC-001** · P1 · IDOR student đọc classroom id brute-force
- [ ] **CLS-SEC-002** · P1 · XSS trong tên lớp escaped FE
- [ ] **CLS-SEC-003** · P2 · Join code enumeration rate limit
- [ ] **CLS-SEC-004** · P2 · Không leak teacher email trong join response
- [ ] **CLS-SEC-005** · P2 · CORS + auth on all classroom endpoints

---

## 8. Error Handling

- [ ] **CLS-ERR-001** · P2 · FE join fail — hiển thị mã sai rõ
- [ ] **CLS-ERR-002** · P2 · Delete classroom fail — toast + list unchanged
- [ ] **CLS-ERR-003** · P2 · Network error load list — retry
- [ ] **CLS-ERR-004** · P3 · 403 friendly message student tạo lớp

---

## 9. API Testing

- [ ] **CLS-API-001** · P1 · Auto · Contract create response
- [ ] **CLS-API-002** · P1 · Auto · Contract list item schema
- [ ] **CLS-API-003** · P2 · Auto · PUT vs PATCH semantics
- [ ] **CLS-API-004** · P2 · Auto · Join endpoint validation messages
- [ ] **CLS-API-005** · P2 · p95 list classrooms < 600ms
- [ ] **CLS-API-006** · P3 · Headers Cache-Control appropriate

---

## 10. Database Validation

- [ ] **CLS-DB-001** · P2 · Member count = COUNT ClassroomMembers active
- [ ] **CLS-DB-002** · P2 · JoinCode unique constraint
- [ ] **CLS-DB-003** · P2 · Delete classroom removes/cascades members
- [ ] **CLS-DB-004** · P3 · TeacherId FK on classroom

---

## 11. End-to-End Testing

- [ ] **CLS-E2E-001** · P1 · Teacher tạo → SV join → cả hai thấy list
- [ ] **CLS-E2E-002** · P1 · Teacher xóa SV → SV mất lớp
- [ ] **CLS-E2E-003** · P2 · Rename lớp → SV thấy tên mới
- [ ] **CLS-E2E-004** · P2 · Delete lớp → exams/assignments inaccessible
- [ ] **CLS-E2E-005** · P2 · 2 SV join cùng code sequential

---

## 12. Non-functional Testing

- [ ] **CLS-NFR-001** · P2 · Classroom list responsive mobile
- [ ] **CLS-NFR-002** · P2 · Join form keyboard accessible
- [ ] **CLS-NFR-003** · P3 · 50 classrooms teacher — UI paginate/virtualize
- [ ] **CLS-NFR-004** · P3 · Copy button feedback UX

---

## 13. Regression Testing

- [ ] **CLS-REG-001** · P1 · Sau exam module — classroom CRUD intact
- [ ] **CLS-REG-002** · P1 · Join flow sau auth change
- [ ] **CLS-REG-003** · P2 · Members API sau assignment add
- [ ] **CLS-REG-004** · P2 · FE routing `/classrooms/:id`

---

## 14. Exploratory Testing

- [ ] **CLS-EXP-001** · P2 · Charter: Teacher onboard lớp mới < 5 phút
- [ ] **CLS-EXP-002** · P2 · Charter: Student join nhầm mã — recovery
- [ ] **CLS-EXP-003** · P3 · Charter: Tên lớp dài trên mobile card

---

## 15. Concurrency & Exception

- [ ] **CLS-CON-001** · P2 · 2 students join same code cùng lúc
- [ ] **CLS-CON-002** · P2 · Teacher delete class while student joining
- [ ] **CLS-CON-003** · P3 · Parallel PATCH name/description

---

## Smoke tối thiểu

- [ ] CLS-FUNC-001 · Create
- [ ] CLS-FUNC-004 · Join
- [ ] CLS-E2E-001 · E2E flow
- [ ] CLS-NEG-001 · Student cannot create
- [ ] CLS-SEC-001 · IDOR

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
