# YTMP3 PRO — Design System

## 1. Visual Theme

Dark audio-studio aesthetic — inspired by Stripe, Linear, and Raycast. The interface feels like a premium mastering console: deep blacks, subtle glassmorphism, and an indigo accent that pulses with energy.

**Key Characteristics:**
- Near-black immersive background (`#0a0a0b`)
- Glassmorphic converter card with backdrop blur
- Indigo accent (`#6366f1`) for interactive elements
- Grain texture overlay for analog warmth
- Ambient radial glow behind the main card
- Waveform animation during audio processing

## 2. Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#0a0a0b` | Page background |
| `--bg-surface` | `#111113` | Cards, panels |
| `--bg-elevated` | `#1a1a1e` | Inputs, interactive surfaces |
| `--bg-hover` | `#222228` | Hover states |
| `--accent` | `#6366f1` | Primary CTA, active states |
| `--accent-hover` | `#818cf8` | Hover accent |
| `--success` | `#22c55e` | Completed states |
| `--warning` | `#f59e0b` | Converting status |
| `--error` | `#ef4444` | Error states |
| `--text-primary` | `#f0f0f3` | Primary text |
| `--text-secondary` | `#71717a` | Muted text |
| `--text-tertiary` | `#3f3f46` | Placeholder text |
| `--border` | `#27272a` | Subtle borders |

## 3. Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display/Headings | Satoshi | 700–900 | 1.25–1.75rem |
| Body | General Sans | 400–500 | 0.85–0.95rem |
| Buttons | Satoshi | 700 | 0.95–1rem |
| Labels | General Sans | 500 | 0.8rem |
| Captions | General Sans | 400 | 0.75rem |

## 4. Component Patterns

- **Cards**: `background: rgba(17,17,19,0.7)` + `backdrop-filter: blur(20px)` + 1px border
- **Inputs**: `#1a1a1e` background, `12px` radius, focus glow ring
- **Buttons**: Indigo fill, `12px` radius, hover lift + glow shadow
- **Format Pills**: Grid of selectable options with active accent border
- **Progress Bar**: Gradient fill with shimmer overlay animation
- **Status Badges**: Colored dot + text, pulsing during active states

## 5. Animation System

| Animation | Purpose | Duration |
|-----------|---------|----------|
| `fadeInUp` | Card entrance | 0.4–0.6s |
| `shimmer` | Progress bar effect | 1.5s loop |
| `wave` | Waveform bars | 1.2s loop |
| `pulse` | Status dot | 1.5s loop |
| `spin` | Loading spinner | 0.6s loop |
| `slideInRight` | Toast notification | 0.3s |

## 6. Responsive Breakpoints

| Breakpoint | Changes |
|-----------|---------|
| < 480px | Compact padding, 2-col format grid |
| 768px+ | Expanded spacing, full-width card |
