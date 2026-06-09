# Quy tắc phát triển EduGuard

> Tài liệu bắt buộc đọc cho developer và agent trước khi commit, push, hoặc ship release.  
> Checklist theo giai đoạn: `Todo List.md` (root). Chính sách Git tóm tắt: `AGENTS.md`.

**Cập nhật:** 2026-06-09

---

## Shell trên Windows

Môi trường mặc định: **PowerShell 5.x** (không dùng `&&`, HEREDOC bash). Agent và developer
làm việc với Git/`gh` theo `.agents/references/powershell-windows.md`.

---

## Quy tắc thực hiện

1. **Một giai đoạn xong mới sang giai đoạn tiếp** — không nhảy sang Redis/SignalR khi Auth chưa ổn.
2. **Mỗi giai đoạn:** backend API → test Swagger → frontend UI → test end-to-end. Trước khi code UI: đọc `docs/design-guidelines.md` và `design.md` (root).
3. **Commit theo cụm chức năng/thư mục** — conventional commit (`feat`, `fix`, `docs`, `build`…).
4. **Không gắn tham chiếu công cụ AI** trong commit message (Husky `commit-msg`).
5. **Không push trực tiếp lên `main`** — làm việc trên `devD` / `devH` / `devB` / `release`.
6. **Luôn cập nhật `Todo List.md`** sau khi hoàn thành hoặc tạo mới phần liên quan chức năng (xem mục [Cập nhật Todo List](#cập-nhật-todo-list)).
7. **Push code** (lưu repo) → skill `.agents/skills/push-code/SKILL.md`.
8. **Ship / release** (production) → skill `.agents/skills/ship-code/SKILL.md`.

### Nhánh Git

| Nhánh | Vai trò |
|-------|---------|
| `devD`, `devH`, `devB` | Phát triển tính năng |
| `release` | Tích hợp trước production |
| `main` | Production — chỉ merge qua PR |

### Commit message

- Format: `type(scope): mô tả` hoặc `type: mô tả`
- Cho phép: `feat`, `fix`, `build`, `ci`, `perf`, `refactor`, `test`, `style`, `docs`, `revert`
- Không dùng: `chore:` (bị Husky chặn)

---

## Workflow push code (lưu repo)

**Kích hoạt:** `push code`, `đẩy code`, `lưu lên github`

| Bước | Việc làm |
|------|----------|
| 1 | `git status` — đảm bảo trên `devD` / `devH` / `devB` (không `main`) |
| 2 | Commit theo cụm chức năng nếu còn thay đổi chưa commit |
| 3 | `git push` nhánh hiện tại |
| 4 | Cập nhật `Todo List.md` nếu vừa xong task |

**Không** chạy github-release, code-reviewer, merge `release`, hay PR `main`.

Chi tiết thực thi: `.agents/skills/push-code/SKILL.md`

---

## Workflow ship / release

**Kích hoạt:** `ship`, `ship code`, `release` — **không** dùng cho push code thường.

```txt
devD/devH/devB  →  github-release (phân tích)  →  code-reviewer  →  release  →  PR main
```

| Bước | Việc làm |
|------|----------|
| 1 | `gh auth`, working tree sạch, `npm test` pass |
| 2 | Phân tích diff + đề xuất SemVer (`vX.Y.Z`) — xác nhận với team |
| 3 | **code-reviewer** — dừng nếu Critical/High |
| 4 | Cập nhật `CHANGELOG.md`, commit trên nhánh dev |
| 5 | Merge nhánh dev → `release`, push |
| 6 | PR `release` → `main` (changelog, review, risks, checklist) |
| 7 | Sau merge: tag `vX.Y.Z` + GitHub Release |

Chi tiết thực thi: `.agents/skills/ship-code/SKILL.md`, `.agents/skills/github-release/SKILL.md`

---

## Cập nhật Todo List

`Todo List.md` (root) là checklist triển khai sống. Mỗi khi hoàn thành hoặc tạo mới phần liên quan chức năng, **bắt buộc cập nhật trong cùng phiên làm việc** trước khi coi task là xong.

### Khi nào phải cập nhật

- Hoàn thành task → đổi `- [ ]` thành `- [x]`
- Tạo mới entity, controller, service, page, API, migration, hub… → bổ sung task nếu chưa có
- Bắt đầu giai đoạn → trạng thái `🟡 Đang làm dở` trong bảng **Trạng thái tổng quan**
- Hoàn thành giai đoạn → trạng thái `✅ Hoàn thành`
- Follow-up mới → thêm vào đúng giai đoạn, không chỉ ghi trong chat/commit

### Cách cập nhật

1. Tìm đúng giai đoạn và task tương ứng.
2. Đánh dấu `- [x]` cho task xong.
3. Thêm dòng mới nếu hạng mục chưa có trong list.
4. Cập nhật bảng **Trạng thái tổng quan** khi tiến độ thay đổi.
5. Cập nhật dòng **Cập nhật** ở đầu `Todo List.md`.
6. Chỉ đánh `✅ Hoàn thành` giai đoạn khi toàn bộ task bắt buộc và tiêu chí hoàn thành đã đạt.

### Ví dụ

| Hành động | Cập nhật trong Todo List |
|-----------|--------------------------|
| Tạo `TestController` | `[x]` task `Tạo TestController` — Giai đoạn 0 |
| Tạo entity `User` | `[x]` task `User` — Giai đoạn 1 |
| Hoàn thành login API + UI | `[x]` các task Auth — Giai đoạn 2 |
| API mới chưa có trong list | Thêm task mới rồi `[x]` |

### Đồng bộ tài liệu khác

| Loại thay đổi | File cập nhật |
|----------------|---------------|
| Tiến độ / task | `Todo List.md` |
| Feature hoàn chỉnh | `docs/project-changelog.md` |
| Release | `CHANGELOG.md` + tag GitHub |

---

## Tài liệu liên quan

| File | Mục đích |
|------|----------|
| `Todo List.md` | Checklist theo giai đoạn (chỉ task, không quy tắc) |
| `AGENTS.md` | Chính sách Git, Husky, changelog — entry point cho agent |
| `docs/project-changelog.md` | Lịch sử thay đổi theo feature |
| `.agents/skills/push-code/SKILL.md` | Thực thi push lưu repo |
| `.agents/skills/ship-code/SKILL.md` | Thực thi ship / release |
| `.agents/references/powershell-windows.md` | Lệnh Git/gh đúng trên Windows |
