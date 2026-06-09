---
version: "1.0.0"
name: EduGuard
description: Apple-inspired app tokens. Flat palette, single CTA accent, EduGuard semantic status.
source: EduGuard unified tokens (Apple-inspired app palette)

colors:
  # — Core (app) —
  primary: "#1D1D1F"
  secondary: "#6E6E73"
  tertiary: "#0071E3"
  link: "#0066CC"
  neutral: "#F5F5F7"
  surface: "#FFFFFF"
  border: "#E8E8ED"
  on-primary: "#FFFFFF"
  obsidian: "#000000"
  # — Semantic (status only, never CTA) —
  success: "#16A34A"
  caution: "#B64400"
  danger: "#DC2626"
  info: "#2563EB"

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

Apple-inspired, **flat**, tối ưu cho **LMS + thi + anti-cheat** — không phải trang marketing sản phẩm.

**Chuẩn triển khai đầy đủ:** [`docs/design-guidelines.md`](docs/design-guidelines.md)

---

## 1. Colors

### 1.1. Core palette

| Token | CSS var | Hex | Vai trò |
|-------|---------|-----|---------|
| `primary` | `--color-primary` | `#1D1D1F` | Headlines, body chính, icon fill |
| `secondary` | `--color-secondary` | `#6E6E73` | Caption, metadata, placeholder |
| `tertiary` | `--color-tertiary` | `#0071E3` | **Duy nhất** cho CTA button, focus ring |
| `link` | `--color-link` | `#0066CC` | Link inline trong text — **không** dùng cho button fill |
| `neutral` | `--color-neutral` | `#F5F5F7` | Nền trang (canvas) |
| `surface` | `--color-surface` | `#FFFFFF` | Card, panel, modal, input |
| `border` | `--color-border` | `#E8E8ED` | Viền card, divider, input border |
| `on-primary` | `--color-on-primary` | `#FFFFFF` | Chữ trên nút tertiary |
| `obsidian` | `--color-obsidian` | `#000000` | Dark card / hero hiếm — dùng tiết kiệm |

### 1.2. Semantic (status & feedback)

Chỉ dùng cho badge, alert, toast, anti-cheat — **không** thay `tertiary` làm CTA.

| Token | CSS var | Hex | Vai trò |
|-------|---------|-----|---------|
| `success` | `--color-success` | `#16A34A` | Đã nộp, hoàn thành, pass |
| `caution` | `--color-caution` | `#B64400` | Sắp hết giờ, cảnh báo anti-cheat nhẹ |
| `danger` | `--color-danger` | `#DC2626` | Lỗi, vi phạm nghiêm trọng |
| `info` | `--color-info` | `#2563EB` | Ghi nhận sự kiện, thông tin trung tính |

### 1.3. Surfaces (elevation bằng màu, không shadow)

| Level | Token | Hex | Dùng cho |
|-------|-------|-----|----------|
| 0 | `neutral` | `#F5F5F7` | Page canvas |
| 1 | `surface` | `#FFFFFF` | Card nổi trên canvas |
| 2 | `neutral` | `#F5F5F7` | Vùng lõm trong card trắng |
| — | `border` | `#E8E8ED` | Phân tách viền |

### 1.4. Không dùng trong app

- Gradient theatrical (Citrus / Indigo / Blush)
- Màu swatch trang trí (`#DDDC8C`, `#E8D0D0`, `#596680`)
- `#0071E3` cho link text (dùng `link` `#0066CC`)
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
background: tertiary (#0071E3)
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
color: link (#0066CC)
underline: on hover only
```

Không fill button bằng `#0066CC`.

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
- Dùng `link` (`#0066CC`) cho anchor text; `tertiary` cho button.
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
  --color-primary: #1d1d1f;
  --color-secondary: #6e6e73;
  --color-tertiary: #0071e3;
  --color-link: #0066cc;
  --color-neutral: #f5f5f7;
  --color-surface: #ffffff;
  --color-border: #e8e8ed;
  --color-on-primary: #ffffff;
  --color-obsidian: #000000;

  /* Semantic */
  --color-success: #16a34a;
  --color-caution: #b64400;
  --color-danger: #dc2626;
  --color-info: #2563eb;

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
  primary: "#1D1D1F",
  secondary: "#6E6E73",
  tertiary: "#0071E3",
  link: "#0066CC",
  neutral: "#F5F5F7",
  surface: "#FFFFFF",
  border: "#E8E8ED",
  "on-primary": "#FFFFFF",
  success: "#16A34A",
  caution: "#B64400",
  danger: "#DC2626",
  info: "#2563EB",
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
