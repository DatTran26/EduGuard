# System & Infrastructure — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§0 System / Infra**  
> Module: **Phase 0** · `F-000-*` · Smoke FE ↔ BE  
> Cập nhật: 2026-06-15  
> Tham chiếu API: `GET /api/test` · `GET /api/test/teacher-only` (`docs/api/api-list.md` API-SYS-02)

**Cách dùng:** Đánh dấu `[x]` khi pass. Ghi defect vào bảng cuối file hoặc defect log master.

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Môi trường | ⬜ Local · ⬜ Staging · ⬜ Docker |
| Branch / build | |
| Backend URL | `https://localhost:7168` |
| Frontend URL | `http://localhost:5173` |
| Ngày bắt đầu / kết thúc | / |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 6 | | | | | |
| 2. Positive | 4 | | | | | |
| 3. Negative | 5 | | | | | |
| 4. BVA | 3 | | | | | |
| 5. Equivalence | 3 | | | | | |
| 6. Edge cases | 4 | | | | | |
| 7. Security | 4 | | | | | |
| 8. Error handling | 3 | | | | | |
| 9. API | 4 | | | | | |
| 10. Database | 2 | | | | | |
| 11. E2E | 3 | | | | | |
| 12. Non-functional | 5 | | | | | |
| 13. Regression | 3 | | | | | |
| 14. Exploratory | 2 | | | | | |
| 15. Concurrency | 2 | | | | | |
| **Tổng** | **50** | | | | | |

---

## 1. Functional Testing

- [ ] **SYS-FUNC-001** · P1 · Auto · `GET /api/test` → JSON `{ success: true }` (hoặc contract hiện tại)
- [ ] **SYS-FUNC-002** · P1 · FE trang test/smoke hiển thị response BE
- [ ] **SYS-FUNC-003** · P1 · Auto · Swagger UI (`/swagger`) mở, liệt kê Auth, Classrooms, Exams
- [ ] **SYS-FUNC-004** · P1 · Auto · CORS: FE `5173` gọi BE `7168` không bị browser block
- [ ] **SYS-FUNC-005** · P2 · `GET /api/test/teacher-only` với JWT Teacher → 200
- [ ] **SYS-FUNC-006** · P2 · Health: BE chạy `dotnet run`, port listen đúng

---

## 2. Positive Testing

- [ ] **SYS-POS-001** · P1 · Auto · `GET /api/test` không auth → 200
- [ ] **SYS-POS-002** · P1 · Auto · `teacher-only` + Bearer Teacher → 200 + body hợp lệ
- [ ] **SYS-POS-003** · P1 · FE `npm run dev` khởi động không lỗi
- [ ] **SYS-POS-004** · P2 · `dotnet build` solution pass

---

## 3. Negative Testing

- [ ] **SYS-NEG-001** · P1 · Auto · `teacher-only` không token → 401
- [ ] **SYS-NEG-002** · P1 · Auto · Student gọi `teacher-only` → 403
- [ ] **SYS-NEG-003** · P1 · Auto · Admin gọi `teacher-only` → 403 (nếu chỉ Teacher)
- [ ] **SYS-NEG-004** · P2 · Gọi endpoint không tồn tại → 404 JSON
- [ ] **SYS-NEG-005** · P2 · Method sai (POST `/api/test`) → 405

---

## 4. Boundary Value Analysis (BVA)

- [ ] **SYS-BVA-001** · P2 · Request header `Authorization: Bearer ` (rỗng) → 401
- [ ] **SYS-BVA-002** · P3 · JWT sắp hết hạn (1s) → vẫn 200 nếu còn valid
- [ ] **SYS-BVA-003** · P3 · FE gọi API khi BE tắt — timeout boundary

---

## 5. Equivalence Partitioning

- [ ] **SYS-EQ-001** · P1 · Partition: no auth → public endpoints only
- [ ] **SYS-EQ-002** · P1 · Partition: Teacher role → teacher-only OK
- [ ] **SYS-EQ-003** · P1 · Partition: Student/Admin → teacher-only denied

---

## 6. Edge Cases

- [ ] **SYS-EDGE-001** · P2 · BE restart giữa session FE — user refresh → recover
- [ ] **SYS-EDGE-002** · P2 · Mixed content HTTP FE → HTTPS BE — browser policy
- [ ] **SYS-EDGE-003** · P3 · Swagger mở song song nhiều tab
- [ ] **SYS-EDGE-004** · P2 · `.env` thiếu `VITE_API_URL` — FE fallback/error rõ

---

## 7. Security Testing

- [ ] **SYS-SEC-001** · P2 · Swagger không hiển thị connection string / JWT secret
- [ ] **SYS-SEC-002** · P1 · `appsettings.Development.json` secrets không commit (git scan)
- [ ] **SYS-SEC-003** · P2 · CORS không `AllowAnyOrigin` + credentials cùng lúc (misconfig)
- [ ] **SYS-SEC-004** · P2 · Response headers không leak server version nhạy cảm (tùy config)

---

## 8. Error Handling

- [ ] **SYS-ERR-001** · P1 · BE exception → JSON ProblemDetails / consistent shape
- [ ] **SYS-ERR-002** · P2 · FE hiển thị lỗi khi `/api/test` fail (network)
- [ ] **SYS-ERR-003** · P2 · Invalid JSON body → 400 không 500

---

## 9. API Testing

- [ ] **SYS-API-001** · P1 · Auto · Contract `/api/test` response schema
- [ ] **SYS-API-002** · P1 · Auto · `Content-Type: application/json` trên API
- [ ] **SYS-API-003** · P2 · Auto · Latency `/api/test` p95 < 200ms local
- [ ] **SYS-API-004** · P2 · Auto · Idempotent GET `/api/test`

---

## 10. Database Validation

- [ ] **SYS-DB-001** · P1 · Migration có thể apply trên DB trống (fresh install)
- [ ] **SYS-DB-002** · P2 · Connection string đúng → BE start không fail EF

---

## 11. End-to-End Testing

- [ ] **SYS-E2E-001** · P1 · Mở FE → gọi smoke API → hiển thị success
- [ ] **SYS-E2E-002** · P1 · Login Teacher → gọi `teacher-only` từ FE (nếu có UI test)
- [ ] **SYS-E2E-003** · P2 · Dev workflow: BE + FE + SQL cùng lúc

---

## 12. Non-functional Testing

- [ ] **SYS-NFR-001** · P2 · Auto · `dotnet test` solution pass
- [ ] **SYS-NFR-002** · P2 · Husky pre-commit `npm test` pass (FE root)
- [ ] **SYS-NFR-003** · P3 · BE cold start < 30s local
- [ ] **SYS-NFR-004** · P2 · `npm run build` FE pass
- [ ] **SYS-NFR-005** · P3 · Memory BE ổn định sau 100 request `/api/test`

---

## 13. Regression Testing

- [ ] **SYS-REG-001** · P1 · Sau merge auth — `/api/test` vẫn 200
- [ ] **SYS-REG-002** · P1 · CORS vẫn OK sau đổi `Program.cs`
- [ ] **SYS-REG-003** · P2 · Swagger vẫn list controllers mới thêm

---

## 14. Exploratory Testing

- [ ] **SYS-EXP-001** · P2 · Charter: Dev mới clone repo — chạy được trong 30 phút theo README
- [ ] **SYS-EXP-002** · P3 · Charter: Đổi port BE — FE config recovery

---

## 15. Concurrency & Exception

- [ ] **SYS-CON-001** · P2 · Auto · 50 concurrent GET `/api/test` — không crash
- [ ] **SYS-CON-002** · P3 · Kill SQL mid-request — graceful error

---

## Smoke tối thiểu

- [ ] SYS-FUNC-001 · `/api/test`
- [ ] SYS-NEG-001 · teacher-only 401
- [ ] SYS-FUNC-004 · CORS
- [ ] SYS-NFR-001 · dotnet test

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|
| | | | | Open | |

---

## Sign-off

| Vai trò | Tên | Ngày | Kết luận |
|---------|-----|------|----------|
| QA | | | ⬜ Pass · ⬜ Pass w/ issues · ⬜ Fail |

---

## Liên kết

- [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md)
- [`README.md`](README.md)
