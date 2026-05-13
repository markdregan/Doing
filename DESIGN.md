# Design System: Doing Task App

## 1. Visual Theme & Atmosphere

**Studio Dark** — Refined, high-contrast dark interface inspired by Claude/Cowork aesthetics. The app communicates professionalism and focus through generous corner radii, subtle border work, and elevation changes that reward interaction. Light mode exists but the design is dark-first — the dark palette is the calibrated version.

**Mood:** Calm, capable, agentic. Not playful, not corporate. Typographic hierarchy does the heavy lifting — color is restrained and semantic.

**Density:** Medium-low. Plenty of whitespace in content areas; chrome surfaces (sidebar, panels) are tighter. Breathing room signals that the AI agent's output is the primary content.

## 2. Color Palette & Roles

### Dark Mode (primary)

| Role | Hex | Usage |
|---|---|---|
| Body background | `#1D1D1F` | Main app canvas, view backgrounds |
| Chrome surface | `#151516` | Sidebar, TaskPanel, MobileDrawer |
| Plate/input surface | `#252526` | Chat input plates, PlanCard, agent chat bubbles |
| Secondary surface | `#1C1C1E` | AgentQuestionCard inputs, status badges, keyboard hints |
| Primary text | `#F5F5F5` | Headings, task titles, active nav labels |
| Secondary text | `#D1D1D6` | Chat bubble content, description text |
| Tertiary text | `#98989D` | Secondary labels, muted metadata |
| Muted text | `#636366` | Placeholder text, timestamps, inactive counts |
| Very muted | `#48484A` | Icon-only buttons, drag handles, divider labels |
| Primary border | `#38383A` | All borders, dividers, dot-grid dots — unified single value |

### Light Mode (secondary)

| Role | Hex | Usage |
|---|---|---|
| Body background | `#FFFFFF` | Main canvas |
| Chrome surface | `#FFFFFF` | Sidebar, panels |
| Plate surface | `#FFFFFF` | Input areas |
| Primary text | `#111111` | Headings, body |
| Border | `#E5E7EB` (gray-100) | All borders, dividers |

### Accent Colors (semantic)

| Role | Hex (light) | Hex (dark) | Usage |
|---|---|---|---|
| AI/Agent accent | `#6366F1` (indigo-500) | `#818CF8` (indigo-400) | Send buttons, sparkle icons, plan approval, active states |
| Action/Info | `#3B82F6` (blue-500) | `#64B5F6` | Links, Share/assign actions, status indicators |
| Success/Complete | `#22C55E` (green-500) | `#4ADE80` | Task completion, plan approved banners |
| Warning/Needs input | `#F59E0B` (amber-500) | `#FBBF24` | Agent questions, awaiting-input view |
| Danger/Delete | `#EF4444` (red-500) | `#F48FB1` | Delete actions, overdue dates |
| Today/Assignee | `#F97316` (orange-500) | `#FB923C` | Today toggle, assignee badges |

### Banned Colors

- Pure black (`#000000`) — never used as background
- Pure white (`#FFFFFF`) — never used as background in dark mode
- Neon/saturated hues for chrome surfaces

## 3. Typography Rules

### Font Stack

- **Sans-serif (UI):** `Inter` — all navigation, labels, task content, buttons, inputs, chat messages
- **Serif (Headings):** `Ibarra Real Nova` → fallback `EB Garamond` → `Georgia` → `serif`
  - **Restricted to hero greeting only** (`text-[42px]` on the home view's welcome message)
  - Banned in: project headers, sidebar, dialogs, task items, cards — anywhere below `text-[24px]`

### Font Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| Hero greeting | 42px | Medium (500) | Home view welcome, serif |
| View heading | 28px | Bold (700) | Logbook, Trash page titles |
| Dialog title | 17px | Bold (700) | Dialog headers |
| Chat input | 16px | Normal (400) | Hero ChatBar textarea |
| Task title | 15px | Normal (400) / Medium (500) | TaskItem collapsed/expanded |
| Search input | 15px | Normal (400) | Search dialog |
| Chat bubble | 14px | Normal (400) | All chat messages across all views |
| Body/nav | 14px (text-sm) | Medium (500) | Sidebar items, buttons |
| Small labels | 13px | Medium (500) | Add task, suggestion chips, compact Send |
| Metadata | 11px | Semibold (600) | Section labels, due dates, badge text |
| Badge | 10px | Medium (500) | Status badges, PlanVersion, tag counts |
| Checklist | 12.5px | Normal (400) | Sub-task items |

### Type Treatment

- **Line height:** `leading-relaxed` (1.625) for chat bubbles and body; `leading-tight` (1.25) for inputs and compact labels
- **Letter spacing:** `tracking-tight` for large headings; `tracking-[0.08em]` for uppercase section labels
- **Uppercase section labels:** `text-[11px] font-semibold tracking-[0.08em]` for "Projects", "Shared with me", "Completed", etc.
- **Antialiasing:** Always on (`-webkit-font-smoothing: antialiased`)

## 4. Component Stylings

### Chat Input Plate (Hero)

- **Shape:** Extremely rounded (`rounded-[28px]`) card container with `border border-gray-200 dark:border-[#38383A]`
- **Surface:** `bg-white dark:bg-[#252526]` — slightly lighter than body background
- **Elevation:** `shadow-sm` default, elevates to `shadow-xl` on focus-within
- **Layout:** Single row with Plus button → textarea → Mic button → Send arrow button
- **Buttons:** `w-10 h-10 rounded-full` with `hover:bg-gray-50 dark:hover:bg-[#323233]` background
- **Send button:** Inverted — `bg-gray-900 dark:bg-[#F5F5F5] text-white dark:text-gray-900` with `shadow-lg` when active
- **Textarea:** Transparent background, `text-[16px]`, auto-grows
- **Placeholder:** `text-gray-400 dark:text-[#636366]`

### Chat Input Plate (Compact)

- **Shape:** Rounded card (`rounded-2xl`) — same border, surface, and shadow pattern as hero but slightly less extreme radius
- **Layout:** Same internal row structure as hero — Plus, textarea, Mic, Send arrow — but smaller container (`min-h-[56px]` vs `min-h-[64px]`)
- **Textarea:** `text-[14px]` — smaller than hero's `text-[16px]`
- **Buttons and Send:** Same sizes (`w-10 h-10`) and styling as hero

### Action Buttons

- **Primary actions** (Sign in, Share, Approve, Send): `rounded-full` (pill-shaped), bold padding (`px-5 py-2.5` or `px-4 py-2`)
  - AI/indigo variant: `bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-500/20`
  - Neutral/dark variant: `bg-gray-900 dark:bg-[#F5F5F5] text-white dark:text-gray-900`
- **Secondary/icon buttons:** `rounded-full` with `hover:bg-gray-50 dark:hover:bg-[#323233]` background
- **Overflow menu items:** `rounded-lg` container (not pill), text-style items with `hover:bg-gray-50 dark:hover:bg-[#252526]`
- **Toggle segments (QuickEntry):** `rounded-md` — intentionally smaller, inline with toggle behavior

### Dialogs

- **Shape:** `rounded-xl` (12px) for all dialogs (QuickEntry, Search, Settings, Share)
- **Surface:** `bg-white dark:bg-[#2C2C2E]` — distinct from body background
- **Border:** `border border-gray-100 dark:border-[#38383A]` — matches unified border color
- **Shadow:** `shadow-2xl` — highest elevation in the system
- **Backdrop:** `bg-black/15 backdrop-blur-sm` — light blur overlay
- **Animation:** `animate-slide-up` on open

### Cards & Containers

- **PlanCard (latest):** `rounded-xl`, `border border-indigo-200 dark:border-indigo-800`, `bg-white dark:bg-[#1C1C1E]`, `shadow-sm`
- **PlanCard (older):** `rounded-xl`, `border border-gray-100 dark:border-[#2C2C2E]`, opaque-reduced
- **AgentQuestionCard:** `rounded-xl`, border varies by status (amber for pending, green for resolved), tinted backgrounds
- **FocusAnchor:** `rounded-xl`, indigo-tinted border and background, subtle
- **Toast:** `rounded-lg`, elevated with `shadow-xl`, dark surface
- **AuthPage card:** `rounded-2xl` (16px), `shadow-sm`, centered modal-like

### Inputs & Forms

- **Text inputs:** `rounded-lg` (8px) with `border border-gray-200 dark:border-[#38383A]`, transparent background, `focus:border-gray-300 dark:focus:border-[#48484A]`
- **Search/autocomplete:** Same as text inputs, no focus ring — border color change only
- **ChatBar textarea:** Transparent background inside plate, full-width, auto-grows
- **AddTaskInput:** Inline, no visible border until focused (then `ring-1 ring-gray-100 dark:ring-[#2C2C2E]`)

### Navigation

- **Sidebar items:** `rounded-lg`, `px-3 py-1`, `text-sm`
  - Active: `bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-[#F5F5F5] font-medium`
  - Inactive: `text-gray-500 dark:text-[#98989D] hover:text-gray-800 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#252526]`
- **Section labels:** `text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em]`
- **Conversation/project merged list:** Single sorted list under "Projects" header

### Task Items

- **Container:** `rounded-lg` with `hover:bg-gray-50/30 dark:hover:bg-white/[0.03]` subtle highlight
- **Expanded:** `border-b border-gray-50 dark:border-[#252526]` with left active bar (`w-[3px] bg-blue-500 dark:bg-[#007AFF] rounded-sm`)
- **Checkbox:** `w-5 h-5 rounded-full` (circular), `border-2 border-gray-300 dark:border-[#48484A]`, turns green on hover over row
- **Checklist checkbox:** `w-3.5 h-3.5 rounded` (square with tiny radius) — intentional distinction from task checkboxes
- **Notes:** `text-[13px] text-gray-400 dark:text-[#98989D]`
- **Due date badge:** `text-[11px] px-1.5 py-0.5 rounded-md` — blue for future, red for overdue

### Dropdowns & Overflow Menus

- **Container:** `rounded-lg` with `shadow-xl`, `border border-gray-100 dark:border-[#38383A]`, `bg-white dark:bg-[#2C2C2E]`
- **Items:** `px-3 py-1.5 text-xs` with `hover:bg-gray-50 dark:hover:bg-[#252526]`
- **Dividers:** `border-t border-gray-100 dark:border-[#38383A] my-1`

### Status & Badge Indicators

- **Status dot:** `w-1.5 h-1.5 rounded-full` with semantic color
- **Progress ring:** 14-20px, `strokeWidth=1.5`, `strokeLinecap="round"`
- **Badge/count:** `text-[10px]` or `text-[11px]` with tinted background
- **Active indicator (plan):** `text-[10px] font-medium text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full`

## 5. Layout Principles

### Chrome Structure

- **Desktop:** Fixed sidebar (`w-[240px]`) + main content area + optional TaskPanel (`w-96`)
- **Mobile:** Hidden sidebar via overlay drawer, top bar (`h-[52px]`) with hamburger + title
- **Content max-width:** `max-w-[680px]` for chat areas, `max-w-2xl` (672px) for hero greeting

### Spacing

- **Content padding:** `px-8` (32px) on all content areas, `py-6` (24px) vertical in scroll areas
- **Sidebar padding:** `px-3` (12px) for nav, `px-5` (20px) for section labels
- **Dialog padding:** `p-5` (20px) internally
- **Gap:** `gap-3` (12px) for chip rows, `gap-2.5` for nav item icon+label, `gap-1.5` for tight icon groups
- **Section spacing:** `mt-6` (24px) between major sidebar sections

### Dot-Grid Background

- Used on content-area backgrounds (HomeView, ProjectView, AwaitingInputView)
- Pattern: `radial-gradient` circles at `1px 1px`, `24px 24px` grid
- Dot color: `#38383A` (same as unified border color) — subtle, non-distracting

## 6. Motion & Interaction

### Animation Engine

- **Curve:** Custom `cubic-bezier(0.16, 1, 0.3, 1)` — snappy spring-like deceleration, used for ALL animations
- **Duration:** 200-300ms range

### Defined Animations

| Name | Properties | Duration | Use Case |
|---|---|---|---|
| `fade-in` | `opacity: 0 → 1` | 300ms | Dialog content, dropdowns, suggestion chips |
| `slide-up` | `opacity: 0 → 1`, `translateY(8px) → 0` | 300ms | View transitions, dialog open, cards appearing |
| `expand-in` | `opacity: 0 → 1`, `translateY(-6px) → 0` | 300ms | PlanCard expand/collapse |
| `scale-in` | `opacity: 0 → 1`, `scale(0.85) → 1` | 200ms | Quick micro-entrances |

### Interaction Patterns

- **Buttons:** `active:scale-95` on suggestion chips for tactile press feedback
- **Chat plate focus:** Shadow elevation `shadow-sm` → `shadow-xl`, border color brightens
- **Hover transitions:** All interactive elements use `transition-all duration-200` or `transition-colors`
- **Drag:** Dragged items at `opacity: 0.4`, `z-index: 50`
- **Mobile drawer:** `transition-transform duration-200` slide in/out

## 7. Anti-Patterns (Banned)

- **No pure black** (`#000000`) backgrounds — all dark surfaces are calibrated grays
- **No serif fonts on utility UI** — serif is restricted to the hero greeting (42px). Banned in: sidebar, dialogs, buttons, cards, task items, project headers
- **No emojis in UI** — use SVG icons for all UI elements
- **No neon glows or outer-glow shadows** — shadows are subtle and diffused (`shadow-sm`, `shadow-xl`, `shadow-2xl` with `shadow-black/10`)
- **No high-contrast color borders in dark mode** — all borders unified at `#38383A`
- **No 3-column equal card layouts** — avoid generic AI-generated card grids
- **No gradient text on headings** — solid color typography only
- **No custom mouse cursors** — system defaults throughout
- **No decorative animation** — motion must be purposeful (entrance, focus, state change)
- **No `font-serif` on project headers, view titles, or small headings** — serif only at hero scale (42px+)
- **No overlapping elements** — clean spatial separation
