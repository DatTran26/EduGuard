# Design Guidelines — EduGuard

> **Mục đích:** Chuẩn UI/UX **bắt buộc** cho mọi thay đổi giao diện. Mục tiêu: UI **chuyên nghiệp, đáng tin, dễ dùng** trong môi trường giáo dục (giáo viên, học sinh, admin).

**Phạm vi:** React + Vite + Tailwind CSS (`frontend/`).  
**Nguồn token gốc:** [`design.md`](../design.md) (Apple-inspired design system, version alpha).  
**Đối tượng:** Developer, AI agent, reviewer.

---

## 1. Design direction — Apple-inspired

EduGuard dùng hướng thiết kế **Apple**: white space cao, sans chặt (SF Pro / Inter), imagery cinematic khi cần, chrome tối thiểu.

### 1.1. Nguyên tắc cốt lõi

| Nguyên tắc | Mô tả |
|------------|--------|
| **Clarity over decoration** | Đọc hiểu nhanh hơn hiệu ứng trang trí. Mỗi màn hình **một hành động chính** (primary action). |
| **Trust & professionalism** | Xử lý điểm số, thi cử, cảnh báo gian lận — UI ổn định, có kiểm soát, không kiểu game/casual. |
| **Negative space is a feature** | Nền `Neutral` mang bố cục; không nhồi component. |
| **Single accent rule** | Màu **Tertiary** (`#0071E3`) là **duy nhất** cho CTA button. Link inline dùng **Link** (`#0066CC`) — không trộn accent khác cho CTA. |
| **Flat on purpose** | **Không gradient.** Hệ thống phẳng, có chủ đích. |

### 1.2. Role-aware UX

| Vai trò | Ưu tiên UX |
|---------|------------|
| **Student** | Đơn giản, ít bước, rõ deadline/trạng thái bài |
| **Teacher** | Tổng quan lớp, bảng dữ liệu, hành động hàng loạt |
| **Admin** | Audit, log, cảnh báo, filter/sort mạnh |

### 1.3. Stress-safe (thi & anti-cheat)

- Màn làm bài: tối thiểu distraction, typography dễ đọc, contrast cao.
- Cảnh báo anti-cheat: rõ mức độ, không modal đỏ full-screen trừ vi phạm nghiêm trọng.
- Auto-save / countdown / trạng thái kết nối **luôn hiển thị**.

### 1.4. Vietnamese-first

- Copy mặc định **tiếng Việt**, câu ngắn, chủ động (“Nộp bài”, “Tạo lớp học”).
- Không đưa thuật ngữ kỹ thuật (JWT, SignalR…) vào UI người dùng cuối.
- Ngày giờ: `dd/MM/yyyy`, `HH:mm` (24h). Ghi timezone nếu liên quan deadline thi.

---

## 2. Design tokens

Định nghĩa tập trung trong [`design.md`](../design.md), `tailwind.config.js` và CSS variables (`frontend/src/index.css`). **Không hardcode** màu/spacing rải rác trong component.

### 2.1. Colors (từ `design.md` v1.0)

Palette flat: neutral tương phản cao, **một accent CTA**, link riêng, semantic cho status.

| Token | Hex | Vai trò |
|-------|-----|---------|
| `primary` | `#1D1D1F` | Headlines, core text |
| `secondary` | `#6E6E73` | Captions, metadata |
| `tertiary` | `#0071E3` | **Duy nhất** cho CTA button, focus ring |
| `link` | `#0066CC` | Link inline — **không** dùng cho button fill |
| `neutral` | `#F5F5F7` | Nền trang (canvas) |
| `surface` | `#FFFFFF` | Card, panel, modal, input |
| `border` | `#E8E8ED` | Viền card, divider, input |
| `on-primary` | `#FFFFFF` | Text trên nút tertiary |

**Semantic (chỉ status, không thay tertiary cho CTA):**

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `success` | `#16A34A` | Đã nộp, hoàn thành, pass |
| `caution` | `#B64400` | Sắp hết giờ, cảnh báo anti-cheat nhẹ |
| `danger` | `#DC2626` | Lỗi, vi phạm nghiêm trọng |
| `info` | `#2563EB` | Ghi nhận sự kiện, thông tin |

**Quy tắc màu:**

- **Do** dùng Tertiary cho **đúng một** primary action mỗi vùng màn hình.
- **Don't** trộn Tertiary với accent khác cho CTA — single-accent rule là load-bearing.
- **Don't** dùng gradient.
- Status badge: semantic color + **icon + text** (không chỉ màu).
- Tương phản text/nền ≥ **WCAG AA** (4.5:1 body, 3:1 large text).

### 2.2. Typography (từ `design.md`)

Font: **Inter** (SF Pro–style tight sans). Hỗ trợ tiếng Việt tốt.

| Cấp | fontSize | fontWeight | letterSpacing | Dùng cho |
|-----|----------|------------|---------------|----------|
| `display` | 5rem (80px) | 600 | -0.035em | Hero marketing (hiếm) |
| `h1` | 2.6rem (~42px) | 600 | default | Tiêu đề trang |
| `body` | 1rem (16px) | 400 | default | Nội dung chính, line-height 1.5 |
| `label` | 0.82rem (~13px) | 500 | 0 | Form label, meta |

**Mapping Tailwind gợi ý:**

| Cấp | Class |
|-----|-------|
| Page title | `text-[2.6rem] font-semibold tracking-tight text-[#1D1D1F]` |
| Section heading | `text-lg font-semibold text-[#1D1D1F]` |
| Body | `text-base leading-relaxed text-[#1D1D1F]` |
| Caption / meta | `text-[0.82rem] font-medium text-[#6E6E73]` |
| Mono (mã lớp, log ID) | `font-mono text-sm` |

Đoạn văn dài (đề thi, mô tả): `leading-relaxed`. Không dùng font size < 12px cho nội dung đọc được.

### 2.3. Spacing (từ `design.md`)

Grid **8px** — scale: `sm` 8px, `md` 16px, `lg` 32px.

| Token | px | Tailwind |
|-------|-----|----------|
| `sm` | 8 | `2` |
| `md` | 16 | `4` |
| `lg` | 32 | `8` |

**Layout:**

- Page padding: `px-4 md:px-6 lg:px-8`, max-width: `max-w-7xl mx-auto`.
- Section gap: `space-y-6` hoặc `gap-6` (24px) giữa block lớn.
- Card padding: `24px` (`p-6`) theo token `card`.

### 2.4. Border radius (từ `design.md`)

| Token | px | Dùng cho |
|-------|-----|----------|
| `rounded.sm` | 8 | Input, badge, chip |
| `rounded.md` | 12 | Button primary |
| `rounded.lg` | 20 | Card, panel |

### 2.5. Elevation

- Ưu tiên **border** (`border-[#6E6E73]/20` hoặc slate-200) + `shadow-sm` nhẹ.
- Modal/dropover: `shadow-lg`, overlay `bg-black/40`.
- Không shadow đậm trừ overlay/modal.

### 2.6. Motion

- Transition: `150–200ms`, `ease-out`.
- Chỉ animate **opacity, transform** (GPU-friendly).
- Không animation loop trên màn thi (trừ loading có chủ đích).
- `prefers-reduced-motion`: tắt/giảm animation.

---

## 3. Components (từ `design.md` + EduGuard)

### 3.1. Button primary (`button-primary`)

```txt
background: tertiary (#0071E3)
text: on-primary (#FFFFFF)
rounded: md (12px)
padding: 12px 20px
```

| Variant | Style | Dùng khi |
|---------|-------|----------|
| **Primary** | Token `button-primary` | Một CTA chính (Tạo lớp, Nộp bài, Bắt đầu thi) |
| **Secondary** | Border + text primary, nền surface | Hủy, Quay lại |
| **Ghost** | Text secondary, không nền | Toolbar, bảng |
| **Danger** | Nền danger semantic | Xóa, kết thúc thi — **không** dùng tertiary |

- Min touch target: **44px** trên mobile.
- Loading: spinner + disable, giữ width cố định.
- Icon + label; icon-only **bắt buộc** `aria-label`.

### 3.2. Card (`card`)

```txt
background: surface (#FFFFFF)
text: primary (#1D1D1F)
rounded: lg (20px)
padding: 24px
```

Đặt trên nền `neutral` (`#F5F5F7`). Không xếp card sát nhau — để negative space thở.

### 3.3. Cấu trúc thư mục (bắt buộc)

```txt
frontend/src/components/
├── common/     # Button, Badge, Input, Modal, Toast, EmptyState, Skeleton
├── layout/     # AppShell, Sidebar, TopBar, PageHeader, Breadcrumb
├── forms/      # FormField, Select, DatePicker, validation UI
└── dashboard/  # StatCard, Chart wrapper, DataTable toolbar
```

- UI theo feature → `features/<module>/components/`.
- **Không** duplicate Button/Input trong từng feature — mở rộng `common/`.

### 3.4. Form

- Label luôn hiển thị (`label` token); placeholder **không** thay label.
- Lỗi: text dưới field + `aria-invalid` + `aria-describedby`.
- Required: `*` + ghi chú đầu form nếu nhiều field.
- Submit disabled khi invalid hoặc đang gửi.

### 3.5. Data display (Teacher/Admin)

- Bảng: sticky header, sort rõ, empty state có CTA.
- Mobile: **card list**, không horizontal scroll bảng rộng.
- Dashboard: **StatCard** thống nhất (label, value, delta, icon).

### 3.6. Feedback

| Tình huống | Pattern |
|------------|---------|
| Thành công ngắn | Toast góc phải, 3–5s |
| Lỗi API | Toast + `message` từ API (`docs/05_API_FRONTEND_INTEGRATION.md` §4) |
| Lỗi form | Inline field errors |
| Xác nhận nguy hiểm | Modal, nút danger bên phải |
| Đang tải | Skeleton cùng layout content thật |
| Không có dữ liệu | EmptyState: icon + title + mô tả + CTA |

**Không** dùng `alert()` browser.

### 3.7. Navigation

- **AppShell**: sidebar (desktop) / drawer (mobile), chrome tối thiểu.
- Active route: font-semibold hoặc accent subtle — không rainbow nav.
- Breadcrumb cho flow sâu (Lớp → Bài thi → Chi tiết).
- Student: **ít menu hơn** Teacher/Admin.

---

## 4. Do's and Don'ts (từ `design.md`)

### Do

- Dùng **Tertiary** cho đúng **một** action chính mỗi screen/section.
- Để **Neutral** mang bố cục — negative space là feature.
- Giữ palette flat, typography chặt, imagery cinematic khi có hero/marketing.
- Dùng semantic colors **chỉ** cho status (success/warning/danger), không cho CTA.

### Don't

- **Không** gradient.
- **Không** trộn Tertiary với accent khác cho button/link chính.
- **Không** purple-neon / glassmorphism / “AI slop” template.
- **Không** nhiều primary button cùng vùng.
- **Không** hardcode hex trong JSX — dùng token / Tailwind theme extend.

---

## 5. Pattern theo module EduGuard

### 5.1. Authentication

- Layout 2 cột (desktop) / 1 cột (mobile), logo + value prop ngắn trên nền neutral.
- Không hiển thị stack trace / mã lỗi kỹ thuật.

### 5.2. Classroom

- Card lớp: tên, mã tham gia (copy), số HS, teacher.
- Mã lớp: monospace + copy + toast “Đã sao chép”.

### 5.3. Assignment

- Badge: `Chưa nộp` | `Đã nộp` | `Quá hạn` | `Đã chấm`.
- Countdown khi deadline < 24h (`caution`).

### 5.4. Exam (làm bài)

- Full-width content; sidebar câu hỏi (desktop) / bottom sheet (mobile).
- Timer **fixed**, visible; `caution` khi < 5 phút.
- Auto-save: “Đã lưu lúc HH:mm” / “Đang lưu…” / “Lỗi lưu — thử lại”.
- Nộp bài: modal xác nhận, liệt kê câu chưa trả lời.

### 5.5. Anti-cheat

| Mức | Màu | Ví dụ |
|-----|-----|-------|
| Info | `info` | Ghi nhận sự kiện |
| Warning | `caution` | Chuyển tab, thoát fullscreen |
| Critical | `danger` | Nhiều vi phạm |

- Teacher: timeline/log có timestamp, loại, học sinh.
- Student: cảnh báo ngắn, hướng dẫn khắc phục.

### 5.6. Notifications (SignalR)

- Bell + badge count.
- Panel: unread first, mark as read.
- Toast realtime cho sự kiện quan trọng.

---

## 6. Accessibility (WCAG 2.2 AA)

- Keyboard: mọi control focus được; tab order hợp lý.
- Focus ring: `ring-2 ring-[#0071E3] ring-offset-2` — không `outline-none` không thay thế.
- Form: `htmlFor`, `aria-describedby` cho lỗi.
- Icon-only: `aria-label` tiếng Việt.
- Modal: focus trap, Esc đóng, `aria-modal="true"`.
- Target tối thiểu **24×24px** (khuyến nghị **44×44px** touch).

---

## 7. Responsive

Breakpoints Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.

| Vùng | Quy tắc |
|------|---------|
| Mobile | Single column; CTA chính có thể fixed bottom |
| Tablet | Sidebar thu gọn hoặc drawer |
| Desktop | Sidebar full; content 2-col khi cần |

- Màn thi: test tối thiểu **375px** width.
- Không ẩn thông tin critical trên mobile.

---

## 8. Copy & tone

- Giọng: chuyên nghiệp, trung tính, hỗ trợ.
- Tránh: “Oops!”, meme, emoji trong dashboard giáo viên/admin.
- Lỗi: “Không thể tải danh sách lớp. Thử lại.” + nút **Thử lại**.
- Empty: “Chưa có lớp nào. Tạo lớp đầu tiên.” + CTA tertiary.

---

## 9. Anti-patterns (cấm)

- Mỗi page một style button/input khác nhau
- Hardcode màu ngoài token (`design.md` / theme)
- Spinner toàn trang khi chỉ reload một section
- Bảng không có empty/loading/error state
- Modal chồng modal > 2 tầng
- Cảnh báo anti-cheat chỉ đổi màu nền, không có text
- Custom CSS file mới khi Tailwind đủ (trừ reset/global)
- Gradient hoặc accent CTA thứ hai cạnh tertiary

---

## 10. Checklist trước khi merge UI

Mọi PR thay đổi `frontend/` **phải** pass:

- [ ] Đã đọc [`design.md`](../design.md) và tuân single-accent + flat palette
- [ ] Dùng component `common/` / pattern đã có
- [ ] Token màu/spacing/radius từ theme, không magic number
- [ ] Đúng **một** tertiary CTA per section
- [ ] Có loading + empty + error state
- [ ] Keyboard + focus visible
- [ ] Responsive 375 / 768 / 1280
- [ ] Copy tiếng Việt, ngày giờ đúng format
- [ ] Màn thi/anti-cheat tuân severity map (nếu liên quan)
- [ ] Không thêm dependency UI mới nếu chưa approve trong issue/PR

---

## 11. Tailwind theme extend (tham khảo)

Khi scaffold frontend, map token vào `tailwind.config.js`:

Xem §7 trong [`design.md`](../design.md) — CSS variables và Tailwind `theme.extend` đầy đủ.

---

## 12. Tham chiếu kỹ thuật

| Tài liệu | Nội dung |
|----------|----------|
| [`design.md`](../design.md) | Token YAML gốc (colors, typography, components) |
| `02_SETUP_AND_PROJECT_STRUCTURE.md` §8 | Cấu trúc folder frontend |
| `05_API_FRONTEND_INTEGRATION.md` §4 | Response/error shape cho toast |
| `01_PROJECT_OVERVIEW.md` §4–6 | Vai trò user, module |

---

## 13. Cập nhật tài liệu

Cập nhật file này **và** [`design.md`](../design.md) khi:

- Thêm variant component vào design system
- Đổi palette / font / spacing scale
- Thêm pattern module mới

Ghi ngắn trong `docs/project-changelog.md` (nhóm Frontend / Design System).
