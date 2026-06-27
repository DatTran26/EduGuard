# Assignment Management — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§5 Assignment**  
> Module: **Phase 5** · `F-ASG-*` · 8/8 API ✓  
> API: `/api/classrooms/{id}/assignments` · submit · grade (`docs/api/api-list.md` API-ASG-*)

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Classroom test | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 12 | | | | | |
| 2. Positive | 6 | | | | | |
| 3. Negative | 8 | | | | | |
| 4. BVA | 6 | | | | | |
| 5. Equivalence | 4 | | | | | |
| 6. Edge cases | 5 | | | | | |
| 7. Security | 5 | | | | | |
| 8. Error handling | 4 | | | | | |
| 9. API | 6 | | | | | |
| 10. Database | 4 | | | | | |
| 11. E2E | 5 | | | | | |
| 12. Non-functional | 3 | | | | | |
| 13. Regression | 4 | | | | | |
| 14. Exploratory | 3 | | | | | |
| 15. Concurrency | 3 | | | | | |
| **Tổng** | **78** | | | | | |

---

## 1. Functional Testing

- [ ] **ASG-FUNC-001** · P1 · Auto · Teacher tạo assignment trong lớp
- [ ] **ASG-FUNC-002** · P1 · Auto · List assignments theo classroom
- [ ] **ASG-FUNC-003** · P1 · Auto · Student xem chi tiết assignment
- [ ] **ASG-FUNC-004** · P1 · Auto · Student submit assignment (text/file per MVP)
- [ ] **ASG-FUNC-005** · P1 · Auto · Teacher list submissions
- [ ] **ASG-FUNC-006** · P1 · Auto · Teacher grade submission (score + feedback)
- [ ] **ASG-FUNC-007** · P2 · Teacher PUT/PATCH/DELETE assignment
- [ ] **ASG-FUNC-008** · P2 · FE form tạo bài tập
- [ ] **ASG-FUNC-009** · P2 · FE student submit UI
- [ ] **ASG-FUNC-010** · P2 · FE teacher grade UI
- [ ] **ASG-FUNC-011** · P2 · Student thấy điểm sau khi graded
- [ ] **ASG-FUNC-012** · P3 · Assignment list sort by deadline

---

## 2. Positive Testing

- [ ] **ASG-POS-001** · P1 · Auto · Create → id + classroomId
- [ ] **ASG-POS-002** · P1 · Auto · Submit → submission row Created
- [ ] **ASG-POS-003** · P1 · Auto · Grade → score persisted
- [ ] **ASG-POS-004** · P2 · PATCH assignment title only
- [ ] **ASG-POS-005** · P2 · Teacher sees all submissions in class
- [ ] **ASG-POS-006** · P2 · Feedback unicode tiếng Việt

---

## 3. Negative Testing

- [ ] **ASG-NEG-001** · P1 · Student tạo assignment → 403
- [ ] **ASG-NEG-002** · P1 · Student submit lớp không tham gia → 403
- [ ] **ASG-NEG-003** · P1 · Submit sau deadline → 400 (nếu enforced)
- [ ] **ASG-NEG-004** · P1 · Teacher B chấm lớp Teacher A → 403
- [ ] **ASG-NEG-005** · P2 · Grade submission không tồn tại → 404
- [ ] **ASG-NEG-006** · P2 · Score > maxScore → 400
- [ ] **ASG-NEG-007** · P2 · Score < 0 → 400
- [ ] **ASG-NEG-008** · P2 · Empty submission body → 400

---

## 4. Boundary Value Analysis (BVA)

- [ ] **ASG-BVA-001** · P2 · Deadline đúng `now` — accept/reject consistent
- [ ] **ASG-BVA-002** · P2 · Score 0 và maxScore
- [ ] **ASG-BVA-003** · P2 · Title length min/max
- [ ] **ASG-BVA-004** · P3 · Submission content max size
- [ ] **ASG-BVA-005** · P3 · maxScore = 0 edge (nếu allowed)
- [ ] **ASG-BVA-006** · P3 · Deadline null = no deadline

---

## 5. Equivalence Partitioning

- [ ] **ASG-EQ-001** · P2 · Partition: before deadline submit OK
- [ ] **ASG-EQ-002** · P2 · Partition: after deadline submit fail
- [ ] **ASG-EQ-003** · P2 · Partition: graded vs ungraded submission
- [ ] **ASG-EQ-004** · P2 · Partition: teacher owner vs other teacher

---

## 6. Edge Cases

- [ ] **ASG-EDGE-001** · P2 · Resubmit policy — overwrite vs reject duplicate
- [ ] **ASG-EDGE-002** · P2 · Known: reload student page — submission state (document)
- [ ] **ASG-EDGE-003** · P2 · Delete assignment có submissions
- [ ] **ASG-EDGE-004** · P3 · Grade rồi sửa điểm lần 2
- [ ] **ASG-EDGE-005** · P3 · Student removed from class — submit denied

---

## 7. Security Testing

- [ ] **ASG-SEC-001** · P1 · Student không xem submission SV khác
- [ ] **ASG-SEC-002** · P1 · IDOR assignment id khác lớp
- [ ] **ASG-SEC-003** · P2 · XSS trong submission content escaped
- [ ] **ASG-SEC-004** · P2 · File upload path traversal (nếu có upload)
- [ ] **ASG-SEC-005** · P2 · Grade API chỉ teacher owner

---

## 8. Error Handling

- [ ] **ASG-ERR-001** · P2 · FE submit fail — giữ draft content
- [ ] **ASG-ERR-002** · P2 · Grade fail — không hiển thị điểm ảo
- [ ] **ASG-ERR-003** · P2 · List empty — empty state UI
- [ ] **ASG-ERR-004** · P3 · 500 grade — retry message

---

## 9. API Testing

- [ ] **ASG-API-001** · P1 · Auto · Contract assignment detail
- [ ] **ASG-API-002** · P1 · Auto · Contract submission list
- [ ] **ASG-API-003** · P2 · Auto · Grade response schema
- [ ] **ASG-API-004** · P2 · PUT vs PATCH assignment
- [ ] **ASG-API-005** · P2 · p95 list assignments
- [ ] **ASG-API-006** · P3 · Idempotent delete 2x

---

## 10. Database Validation

- [ ] **ASG-DB-001** · P2 · Submission count sau grade
- [ ] **ASG-DB-002** · P2 · FK assignment → classroom
- [ ] **ASG-DB-003** · P2 · Unique student per assignment submission (nếu rule)
- [ ] **ASG-DB-004** · P3 · GradedAt timestamp set

---

## 11. End-to-End Testing

- [ ] **ASG-E2E-001** · P1 · Teacher giao → SV nộp → chấm → SV thấy điểm
- [ ] **ASG-E2E-002** · P2 · Edit assignment sau khi có submission
- [ ] **ASG-E2E-003** · P2 · Multiple students submit — teacher grades all
- [ ] **ASG-E2E-004** · P2 · Dashboard pending count updates (mock/real)
- [ ] **ASG-E2E-005** · P3 · Delete assignment end-to-end cleanup

---

## 12. Non-functional Testing

- [ ] **ASG-NFR-001** · P2 · Mobile submit form usable
- [ ] **ASG-NFR-002** · P3 · 100 submissions list perf
- [ ] **ASG-NFR-003** · P3 · Long feedback text wrap UI

---

## 13. Regression Testing

- [ ] **ASG-REG-001** · P1 · Sau exam module — assignment CRUD OK
- [ ] **ASG-REG-002** · P2 · Classroom delete impact assignments
- [ ] **ASG-REG-003** · P2 · Auth interceptor submit OK
- [ ] **ASG-REG-004** · P2 · npm test assignment components

---

## 14. Exploratory Testing

- [ ] **ASG-EXP-001** · P2 · Charter: SV nộp sát deadline — UX stress
- [ ] **ASG-EXP-002** · P2 · Charter: Teacher chấm 20 bài liên tiếp
- [ ] **ASG-EXP-003** · P3 · Charter: Hiểu trạng thái đã nộp/chưa nộp

---

## 15. Concurrency & Exception

- [ ] **ASG-CON-001** · P2 · Double-click submit — một submission
- [ ] **ASG-CON-002** · P2 · Teacher grade + student resubmit race
- [ ] **ASG-CON-003** · P3 · Parallel creates assignments same class

---

## Smoke tối thiểu

- [ ] ASG-FUNC-001 · Create
- [ ] ASG-FUNC-004 · Submit
- [ ] ASG-FUNC-006 · Grade
- [ ] ASG-E2E-001 · Full flow
- [ ] ASG-SEC-001 · Isolation

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
