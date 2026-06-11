---
version: "1.1.0"
name: EduGuard
description: Institutional Slate tokens. Flat premium palette, single CTA accent, EduGuard semantic status.
source: EduGuard unified tokens (Apple discipline + B2B education SaaS trust)

colors:
  # — Core (app) —
  primary: "#0F172A"
  secondary: "#64748B"
  tertiary: "#1D4ED8"
  tertiary-hover: "#1E3A8A"
  link: "#1E40AF"
  neutral: "#F8FAFC"
  surface: "#FFFFFF"
  surface-sunken: "#F1F5F9"
  border: "#E2E8F0"
  border-subtle: "#F1F5F9"
  on-primary: "#FFFFFF"
  obsidian: "#0B1120"
  # — Semantic (status only, never CTA) —
  success: "#047857"
  success-muted: "#ECFDF5"
  caution: "#B45309"
  caution-muted: "#FFFBEB"
  danger: "#DC2626"
  danger-muted: "#FEF2F2"
  info: "#0369A1"
  info-muted: "#EFF6FF"

typography:
  fontFamily:
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace"
  scale:
    caption: { fontSize: 12px, lineHeight: 1.33, fontWeight: 400, letterSpacing: "-0.02em" }
    label: { fontSize: 13px, lineHeight: 1.43, fontWeight: 500, letterSpacing: "0" }
    body-sm: { fontSize: 14px, lineHeight: 1.43, fontWeight: 400, letterSpacing: "-0.003em" }
    body: { fontSize: 16px, lineHeight: 1.5, fontWeight: 400, letterSpacing: "0" }
    subheading: { fontSize: 20px, lineHeight: 1.4, fontWeight: 500, letterSpacing: "-0.01em" }
    h1: { fontSize: 42px, lineHeight: 1.17, fontWeight: 600, letterSpacing: "-0.015em" }
    display: { fontSize: 80px, lineHeight: 1.04, fontWeight: 600, letterSpacing: "-0.035em" }

spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 48px

rounded:
  sm: 8px
  md: 12px
  lg: 20px
  xl: 28px
  pill: 999px

layout:
  pageMaxWidth: 1280px
  cardPadding: 24px
  sectionGap: 24px

elevation:
  shadow: none
  method: surface-color-only

components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-primary}"
    borderRadius: "{rounded.md}"
    padding: "12px 20px"
    minHeight: 44px
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    border: "1px solid {colors.border}"
    borderRadius: "{rounded.md}"
    padding: "12px 20px"
  link:
    color: "{colors.link}"
    textDecoration: none
    hoverTextDecoration: underline
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    borderRadius: "{rounded.lg}"
    padding: "{layout.cardPadding}"
    border: "1px solid {colors.border}"
  input:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    borderRadius: "{rounded.sm}"
    focusRing: "{colors.tertiary}"

excluded:
  - Product finish gradients (Citrus, Indigo, Blush)
  - Product swatch colors as UI accents
  - Box shadows on cards
  - Display headlines above 80px in app screens
---

# EduGuard Design Tokens

**Institutional Slate** — flat, premium, tối ưu cho **LMS + thi + anti-cheat**. Giữ kỷ luật Apple (một CTA, không shadow), nâng cấp neutral slate + blue có authority cho cảm giác B2B education SaaS.

**v1.1 (2026-06-11):** Chuyển từ Apple Gray sang Slate; CTA sâu hơn; thêm `*-muted` cho badge/alert surface.

**Chuẩn triển khai đầy đủ:** [`docs/design-guidelines.md`](docs/design-guidelines.md)

---

## 1. Colors

### 1.1. Core palette

| Token | CSS var | Hex | Vai trò |
|-------|---------|-----|---------|
| `primary` | `--color-primary` | `#0F172A` | Headlines, body chính, icon fill — slate authority |
| `secondary` | `--color-secondary` | `#64748B` | Caption, metadata, placeholder |
| `tertiary` | `--color-tertiary` | `#1D4ED8` | **Duy nhất** cho CTA button, focus ring |
| `tertiary-hover` | `--color-tertiary-hover` | `#1E3A8A` | Hover / pressed state của CTA |
| `link` | `--color-link` | `#1E40AF` | Link inline trong text — **không** dùng cho button fill |
| `neutral` | `--color-neutral` | `#F8FAFC` | Nền trang (canvas) |
| `surface` | `--color-surface` | `#FFFFFF` | Card, panel, modal, input |
| `surface-sunken` | `--color-surface-sunken` | `#F1F5F9` | Vùng lõm trong card trắng (inset) |
| `border` | `--color-border` | `#E2E8F0` | Viền card, divider, input border |
| `border-subtle` | `--color-border-subtle` | `#F1F5F9` | Divider nhẹ, separator trong card |
| `on-primary` | `--color-on-primary` | `#FFFFFF` | Chữ trên nút tertiary |
| `obsidian` | `--color-obsidian` | `#0B1120` | Dark card / hero hiếm — midnight, không pure black |

### 1.2. Semantic (status & feedback)

Chỉ dùng cho badge, alert, toast, anti-cheat — **không** thay `tertiary` làm CTA.

| Token | CSS var | Hex | Vai trò |
|-------|---------|-----|---------|
| `success` | `--color-success` | `#047857` | Đã nộp, hoàn thành, pass |
| `success-muted` | `--color-success-muted` | `#ECFDF5` | Nền badge/alert success |
| `caution` | `--color-caution` | `#B45309` | Sắp hết giờ, cảnh báo anti-cheat nhẹ |
| `caution-muted` | `--color-caution-muted` | `#FFFBEB` | Nền badge/alert caution |
| `danger` | `--color-danger` | `#DC2626` | Lỗi, vi phạm nghiêm trọng |
| `danger-muted` | `--color-danger-muted` | `#FEF2F2` | Nền badge/alert danger |
| `info` | `--color-info` | `#0369A1` | Ghi nhận sự kiện, thông tin trung tính |
| `info-muted` | `--color-info-muted` | `#EFF6FF` | Nền badge/alert info |

### 1.3. Surfaces (elevation bằng màu, không shadow)

| Level | Token | Hex | Dùng cho |
|-------|-------|-----|----------|
| 0 | `neutral` | `#F8FAFC` | Page canvas |
| 1 | `surface` | `#FFFFFF` | Card nổi trên canvas |
| 2 | `surface-sunken` | `#F1F5F9` | Vùng lõm trong card trắng |
| — | `border` | `#E2E8F0` | Phân tách viền |

### 1.4. Không dùng trong app

- Gradient theatrical (Citrus / Indigo / Blush)
- Màu swatch trang trí (`#DDDC8C`, `#E8D0D0`, `#596680`)
- `#1D4ED8` cho link text (dùng `link` `#1E40AF`)
- Box-shadow trên card

---

## 2. Typography

Font: **Inter** (thay SF Pro trên web, hỗ trợ tiếng Việt).

| Token | Size | Weight | Line height | Dùng cho |
|-------|------|--------|-------------|----------|
| `caption` | 12px | 400 | 1.33 | Timestamp, footnote, nav nhỏ |
| `label` | 13px | 500 | 1.43 | Form label, badge text |
| `body-sm` | 14px | 400 | 1.43 | Bảng, sub-nav, metadata |
| `body` | 16px | 400 | 1.5 | Nội dung chính, button label |
| `subheading` | 20px | 500 | 1.4 | Mô tả section |
| `h1` | 42px | 600 | 1.17 | Tiêu đề trang app |
| `display` | 80px | 600 | 1.04 | Hero login/landing **only** |

`mono`: mã lớp, log ID, countdown monospace.

Không dùng `display` > 80px trong dashboard, form, màn thi.

---

## 3. Spacing

Base unit: **4px**. Grid ưu tiên bội số 8.

| Token | px | Tailwind |
|-------|-----|----------|
| `xs` | 4 | `1` |
| `sm` | 8 | `2` |
| `md` | 16 | `4` |
| `lg` | 24 | `6` |
| `xl` | 32 | `8` |
| `section` | 48 | `12` |

- Page padding: `16–32px` responsive
- `pageMaxWidth`: `1280px`
- `cardPadding`: `24px`
- `sectionGap`: `24px` giữa block lớn trong app

---

## 4. Border radius

| Token | px | Dùng cho |
|-------|-----|----------|
| `sm` | 8 | Input, badge, chip |
| `md` | 12 | Button primary/secondary (app default) |
| `lg` | 20 | Card dashboard (app default) |
| `xl` | 28 | Card marketing / login hero (tùy chọn) |
| `pill` | 999 | CTA hero landing **only** — không dùng trong form thi |

---

## 5. Components

### Button primary

```
background: tertiary (#1D4ED8)
hover: tertiary-hover (#1E3A8A)
color: on-primary (#FFFFFF)
border-radius: md (12px)
padding: 12px 20px
min-height: 44px
```

Một primary button per section. Loading: spinner + disabled, giữ width.

### Button secondary

```
background: transparent
color: primary
border: 1px solid border (#E8E8ED)
border-radius: md (12px)
```

### Link

```
color: link (#1E40AF)
underline: on hover only
```

Không fill button bằng `#1E40AF`.

### Card

```
background: surface (#FFFFFF)
color: primary
border: 1px solid border
border-radius: lg (20px)
padding: 24px
box-shadow: none
```

Trên nền `neutral`. Để negative space giữa các card.

### Input

```
background: surface
border: 1px solid border
border-radius: sm (8px)
focus: ring 2px tertiary
```

---

## 6. Do's and Don'ts

### Do

- Dùng `tertiary` cho **đúng một** primary CTA mỗi section.
- Dùng `link` (`#1E40AF`) cho anchor text; `tertiary` cho button.
- Để `neutral` mang bố cục — negative space là feature.
- Elevation chỉ bằng chênh `neutral` / `surface` / `border`.
- Semantic + icon + text cho mọi status badge.

### Don't

- Gradient (app flat on purpose).
- `tertiary` cho link inline hoặc accent thứ hai.
- Box-shadow trên card/container.
- Hardcode hex trong component — dùng token/CSS var.
- Gradient hoặc màu swatch trang trí làm UI chrome.

---

## 7. CSS custom properties

```css
:root {
  /* Core */
  --color-primary: #0f172a;
  --color-secondary: #64748b;
  --color-tertiary: #1d4ed8;
  --color-tertiary-hover: #1e3a8a;
  --color-link: #1e40af;
  --color-neutral: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-sunken: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-subtle: #f1f5f9;
  --color-on-primary: #ffffff;
  --color-obsidian: #0b1120;

  /* Semantic */
  --color-success: #047857;
  --color-success-muted: #ecfdf5;
  --color-caution: #b45309;
  --color-caution-muted: #fffbeb;
  --color-danger: #dc2626;
  --color-danger-muted: #fef2f2;
  --color-info: #0369a1;
  --color-info-muted: #eff6ff;

  /* Typography */
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-pill: 999px;

  /* Layout */
  --page-max-width: 1280px;
  --card-padding: 24px;
  --section-gap: 24px;
}
```

### Tailwind `theme.extend` (tham khảo)

```js
colors: {
  primary: "#0F172A",
  secondary: "#64748B",
  tertiary: "#1D4ED8",
  "tertiary-hover": "#1E3A8A",
  link: "#1E40AF",
  neutral: "#F8FAFC",
  surface: "#FFFFFF",
  "surface-sunken": "#F1F5F9",
  border: "#E2E8F0",
  "border-subtle": "#F1F5F9",
  "on-primary": "#FFFFFF",
  obsidian: "#0B1120",
  success: "#047857",
  "success-muted": "#ECFDF5",
  caution: "#B45309",
  "caution-muted": "#FFFBEB",
  danger: "#DC2626",
  "danger-muted": "#FEF2F2",
  info: "#0369A1",
  "info-muted": "#EFF6FF",
},
borderRadius: {
  sm: "8px",
  md: "12px",
  lg: "20px",
  xl: "28px",
  pill: "999px",
},
fontFamily: {
  sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
  mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
},
```
