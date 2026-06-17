# Docker & Deployment — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§14 Docker**  
> Module: **Phase 11** · `docker-compose.yml`  
> Trạng thái: ⬜ Chưa triển khai

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Docker version | |
| Compose file | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 8 | | | | | |
| 2. Positive | 5 | | | | | |
| 3. Negative | 5 | | | | | |
| 4. BVA | 3 | | | | | |
| 5. Equivalence | 2 | | | | | |
| 6. Edge cases | 4 | | | | | |
| 7. Security | 5 | | | | | |
| 8. Error handling | 4 | | | | | |
| 9. API | 3 | | | | | |
| 10. Database | 3 | | | | | |
| 11. E2E | 5 | | | | | |
| 12. Non-functional | 4 | | | | | |
| 13. Regression | 3 | | | | | |
| 14. Exploratory | 2 | | | | | |
| 15. Concurrency | 2 | | | | | |
| **Tổng** | **58** | | | | | |

---

## 1. Functional Testing

- [ ] **DOCKER-FUNC-001** · P1 · ⬜ `docker compose up` — SQL + Redis + BE + FE
- [ ] **DOCKER-FUNC-002** · P1 · ⬜ Smoke `GET /api/test` qua container BE
- [ ] **DOCKER-FUNC-003** · P2 · ⬜ FE nginx/serve proxy tới BE network
- [ ] **DOCKER-FUNC-004** · P2 · ⬜ EF migration chạy khi BE start
- [ ] **DOCKER-FUNC-005** · P2 · ⬜ Volume SQL data persist
- [ ] **DOCKER-FUNC-006** · P2 · ⬜ Volume Redis persist (nếu cần)
- [ ] **DOCKER-FUNC-007** · P3 · ⬜ `docker compose down` clean stop
- [ ] **DOCKER-FUNC-008** · P3 · ⬜ Healthcheck containers pass

---

## 2. Positive Testing

- [ ] **DOCKER-POS-001** · P1 · ⬜ Full stack accessible browser localhost
- [ ] **DOCKER-POS-002** · P1 · ⬜ Login qua compose FE+BE
- [ ] **DOCKER-POS-003** · P2 · ⬜ Rebuild image — data volume giữ
- [ ] **DOCKER-POS-004** · P2 · ⬜ `docker compose pull` + up
- [ ] **DOCKER-POS-005** · P3 · ⬜ Swagger qua exposed BE port

---

## 3. Negative Testing

- [ ] **DOCKER-NEG-001** · P2 · ⬜ Thiếu env JWT key — BE fail fast message
- [ ] **DOCKER-NEG-002** · P2 · ⬜ SQL not ready — BE retry/backoff
- [ ] **DOCKER-NEG-003** · P2 · ⬜ Wrong connection string — clear error
- [ ] **DOCKER-NEG-004** · P3 · ⬜ Port conflict host — compose error readable
- [ ] **DOCKER-NEG-005** · P3 · ⬜ FE build arg missing API URL

---

## 4. Boundary Value Analysis (BVA)

- [ ] **DOCKER-BVA-001** · P3 · ⬜ SQL volume disk almost full
- [ ] **DOCKER-BVA-002** · P3 · ⬜ Memory limit container OOM restart
- [ ] **DOCKER-BVA-003** · P3 · ⬜ Max connections SQL default

---

## 5. Equivalence Partitioning

- [ ] **DOCKER-EQ-001** · P2 · ⬜ Dev compose vs prod compose profiles
- [ ] **DOCKER-EQ-002** · P3 · ⬜ Bind mount dev vs image-only prod

---

## 6. Edge Cases

- [ ] **DOCKER-EDGE-001** · P2 · ⬜ `compose up` twice — idempotent
- [ ] **DOCKER-EDGE-002** · P2 · ⬜ Kill BE container — restart policy
- [ ] **DOCKER-EDGE-003** · P3 · ⬜ Windows path volume mount
- [ ] **DOCKER-EDGE-004** · P3 · ⬜ ARM vs x86 image build

---

## 7. Security Testing

- [ ] **DOCKER-SEC-001** · P1 · ⬜ Secrets qua env / compose secrets, không trong image
- [ ] **DOCKER-SEC-002** · P1 · ⬜ SQL port không expose public unnecessarily
- [ ] **DOCKER-SEC-003** · P2 · ⬜ Redis requirepass trong compose
- [ ] **DOCKER-SEC-004** · P2 · ⬜ Non-root user trong Dockerfile (nếu có)
- [ ] **DOCKER-SEC-005** · P3 · ⬜ .env trong .dockerignore

---

## 8. Error Handling

- [ ] **DOCKER-ERR-001** · P2 · ⬜ Migration fail — container exit non-zero
- [ ] **DOCKER-ERR-002** · P2 · ⬜ BE crash loop — logs visible `docker logs`
- [ ] **DOCKER-ERR-003** · P3 · ⬜ FE 502 khi BE down — message
- [ ] **DOCKER-ERR-004** · P3 · ⬜ Graceful shutdown SIGTERM

---

## 9. API Testing

- [ ] **DOCKER-API-001** · P1 · ⬜ All smoke APIs qua compose network
- [ ] **DOCKER-API-002** · P2 · ⬜ SignalR websocket qua reverse proxy
- [ ] **DOCKER-API-003** · P3 · ⬜ HTTPS termination at proxy (prod pattern)

---

## 10. Database Validation

- [ ] **DOCKER-DB-001** · P2 · ⬜ Migration applied inside SQL container
- [ ] **DOCKER-DB-002** · P2 · ⬜ Data survive `compose down` without `-v`
- [ ] **DOCKER-DB-003** · P3 · ⬜ Backup volume snapshot restore

---

## 11. End-to-End Testing

- [ ] **DOCKER-E2E-001** · P1 · ⬜ Register → thi → anti-cheat trên compose
- [ ] **DOCKER-E2E-002** · P2 · ⬜ Teacher monitor realtime compose
- [ ] **DOCKER-E2E-003** · P2 · ⬜ Assignment flow compose
- [ ] **DOCKER-E2E-004** · P3 · ⬜ Fresh machine clone → compose only onboarding
- [ ] **DOCKER-E2E-005** · P3 · ⬜ Scale BE 2 replicas (nếu supported)

---

## 12. Non-functional Testing

- [ ] **DOCKER-NFR-001** · P2 · ⬜ Cold start compose < 5 phút local
- [ ] **DOCKER-NFR-002** · P3 · ⬜ Image size BE/FE reasonable
- [ ] **DOCKER-NFR-003** · P3 · ⬜ CPU/RAM usage idle acceptable
- [ ] **DOCKER-NFR-004** · P3 · ⬜ Build cache layer Dockerfile optimized

---

## 13. Regression Testing

- [ ] **DOCKER-REG-001** · P2 · ⬜ Rebuild after code change — smoke pass
- [ ] **DOCKER-REG-002** · P2 · ⬜ Local non-docker tests still pass
- [ ] **DOCKER-REG-003** · P3 · ⬜ Compose env parity với README

---

## 14. Exploratory Testing

- [ ] **DOCKER-EXP-001** · P3 · ⬜ Charter: Dev mới chỉ dùng Docker setup
- [ ] **DOCKER-EXP-002** · P3 · ⬜ Charter: Recover từ `docker system prune`

---

## 15. Concurrency & Exception

- [ ] **DOCKER-CON-001** · P3 · ⬜ 10 users E2E against compose instance
- [ ] **DOCKER-CON-002** · P3 · ⬜ Restart SQL during light load

---

## Smoke tối thiểu (khi Phase 11 ready)

- [ ] DOCKER-FUNC-001 · compose up
- [ ] DOCKER-FUNC-002 · api/test
- [ ] DOCKER-E2E-001 · full journey
- [ ] DOCKER-SEC-001 · secrets env

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|

---

## Sign-off

| QA | | | ⬜ Blocked · ⬜ Pass · ⬜ Fail |

---

## Liên kết

- `docs/02_SETUP_AND_PROJECT_STRUCTURE.md`
- [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md)
