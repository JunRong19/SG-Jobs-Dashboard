---
name: Job Application Tracker
description: A clean white personal dashboard where the score reads as a traffic light, each company gets its own color, and every other surface stays quiet.
colors:
  white: "#ffffff"
  gray-100: "#f4f4f5"
  gray-200: "#e4e4e7"
  gray-300: "#d4d4d8"
  gray-400: "#a1a1aa"
  gray-500: "#71717a"
  gray-600: "#52525b"
  gray-700: "#3f3f46"
  gray-800: "#27272a"
  gray-900: "#18181b"
  navy-50: "#eef1f5"
  navy-100: "#dde3ea"
  navy-200: "#c1c9d6"
  navy-300: "#94a1b5"
  navy-400: "#64748b"
  navy-500: "#0f172a"
  navy-600: "#0b1220"
  navy-700: "#070c16"
  navy-800: "#030509"
  secondary-slate-50: "#f1f5f9"
  secondary-slate-100: "#e2e8f0"
  secondary-slate-400: "#64748b"
  secondary-slate-500: "#475569"
  secondary-slate-600: "#334155"
  secondary-slate-700: "#1e293b"
  bucket-all: "#0ea5e9"
  bucket-applied: "#6366f1"
  bucket-in-progress: "#f59e0b"
  bucket-not-interested: "#94a3b8"
  bucket-rejected: "#f43f5e"
  bucket-expired: "#78716c"
  score-great-bg: "#dcfce7"
  score-great-text: "#166534"
  score-good-bg: "#fef9c3"
  score-good-text: "#854d0e"
  score-fair-bg: "#ffedd5"
  score-fair-text: "#9a3412"
  score-poor-bg: "#fee2e2"
  score-poor-text: "#991b1b"
  success-mist: "#ecfdf5"
  success-text: "#047857"
  status-in-progress-mist: "#fffbeb"
  status-in-progress-text: "#b45309"
  status-rejected-mist: "#fff1f2"
  status-rejected-text: "#be123c"
typography:
  headline:
    fontFamily: "Poppins, Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Poppins, Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  full: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.navy-500}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.navy-600}"
  button-secondary:
    backgroundColor: "{colors.secondary-slate-500}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-slate-600}"
  badge-score-great:
    backgroundColor: "{colors.score-great-bg}"
    textColor: "{colors.score-great-text}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-score-poor:
    backgroundColor: "{colors.score-poor-bg}"
    textColor: "{colors.score-poor-text}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  card-stat:
    backgroundColor: "{colors.white}"
    textColor: "{colors.gray-900}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Job Application Tracker

## Overview

**Creative North Star: "White Ledger, Traffic-Light Signal"**

This is a solo operator's ledger, not a SaaS dashboard performing productivity for an audience. Every screen exists for one person doing one session of work: open, review what changed, act on a few rows, close. The canvas is white and the chrome is neutral gray by default, so the places color is deliberately spent stand out without competing: the resume-match score, which reads as a traffic light (green means act on this, red means skip it); the company avatar, which uses its own muted color per company purely to make a scrolling list of similar-looking rows easy to tell apart at a glance; and the six pipeline buckets, each with its own fixed, mutually-distinct hue. Selection and the primary action carry a single near-black navy accent, and the secondary action (View Resume, View Cover Letter) carries its own muted slate — two colors doing two different jobs, neither of them gray, neither of them borrowed from the score scale or the bucket palette.

This is the sixth iteration of a redesign. The first went fully monochrome-plus-one-accent and cut the avatar rotation and stat-card top bar entirely; both came back in the second pass as real wayfinding aids. The third pass moved the accent off emerald (it shared a hue family with the score scale) to indigo, and fixed two bucket top-bars reading as the same color. The fourth pass moved the accent again, off indigo (it read as "purple") to a deep teal, and gave the newly-freed indigo to the secondary-action buttons instead of leaving them on neutral gray, where they'd read as disabled. The fifth pass moved the accent a third time, off teal to a near-black navy, per direct user preference for a darker, more neutral-reading primary color. The sixth pass caught what the fifth left inconsistent: the secondary-action buttons still carried indigo, which had paired fine with teal but read as an off, clashing bright purple-blue next to the new near-black navy — so secondary action moved from indigo to a muted slate, same cool-neutral family as navy, distinctly lighter so it still reads as clickable.

**Key Characteristics:**
- Pure white canvas and cards; neutral gray (zinc-scale) for text, borders, dividers, and secondary chrome
- Resume-match score uses a dedicated 4-band traffic-light scale (green/yellow/orange/red) independent of every other color in the system — this is the one place color encodes a continuous value, not a category
- Company avatars get a deterministic, muted color per company (8-hue rotation, 50-tint backgrounds), restored specifically to help differentiate rows in a dense list without reading as bright or loud
- Six pipeline buckets, six deliberately distinct hues (sky/indigo/amber/slate/rose/stone) — no two adjacent buckets share a hue family, and none reads as near-black
- A near-black navy is the single accent for selection and the primary action; a muted slate is the dedicated secondary-action color (never plain earth-gray, so secondary buttons don't read as disabled) — both are picked to sit outside the score scale's and the bucket palette's hue ranges
- Flat-to-barely-elevated: `shadow-sm` is the ceiling; depth comes from a 1px border, not heavy shadow

## Colors

Five independent color jobs, each with its own palette, so no single hue is asked to mean two things: score (traffic light), bucket/status (six fixed categorical hues), accent (near-black navy), secondary action (slate), avatar (eight rotating, muted categorical hues).

### Score scale (traffic light — resume-match only)
- **Great, ≥80** (`score-great-bg` #dcfce7 / `score-great-text` #166534): This is the best possible outcome for a match — worth opening first.
- **Good, 60–79** (`score-good-bg` #fef9c3 / `score-good-text` #854d0e): Worth a look, not a priority.
- **Fair, 40–59** (`score-fair-bg` #ffedd5 / `score-fair-text` #9a3412): Marginal.
- **Poor, <40** (`score-poor-bg` #fee2e2 / `score-poor-text` #991b1b): Skip unless nothing better is available.
- This scale never appears on anything except the score badge. Nothing else in the system borrows green-means-good/red-means-bad.

### Accent (selection + primary action)
- **Navy 500** (#0f172a): Primary buttons ("View Job Listing", "Generate Cover Letter"), search's active button. Near-black by design — this is the darkest color used as a fill anywhere in the system, chosen over a brighter accent specifically for a more neutral, less "branded" main color.
- **Navy 300 / 400**: Selected-row ring, active focus ring — outline and tint, never a fill.
- Chosen specifically to not share a hue family with the score scale (green/yellow/orange/red), the bucket palette (sky/indigo/amber/slate/rose/stone), or the secondary-action color (slate). Being near-black also keeps it visually distinct from every other muted/neutral gray in the system — those are all `earth-*` zinc tones, never `clay-*` navy tones, even though both read as "dark and quiet" at a glance.

### Secondary action (View Resume, View Cover Letter)
- **Slate 500 / 600** (#475569 / #334155): The second-tier action button. Previously this token was collapsed onto the neutral-gray scale, which made secondary buttons look disabled rather than clickable; then briefly moved to a saturated indigo, which clashed sitting next to the near-black navy accent — vivid purple-blue next to near-black read as mismatched rather than intentional. Slate is in the same cool-neutral family as the navy accent (so it visually belongs) but distinctly lighter (so it still reads as clickable, not gray-disabled). Indigo now lives only on the "applied" bucket's identity color (see Bucket palette), unrelated to this button.

### Bucket palette (categorical, fixed per bucket)
Six buckets, six hand-picked, maximally-distinct hues — this is the palette an earlier iteration got wrong (two buckets shared a muted brown-red, one used near-black), so the values here are load-bearing, not arbitrary. Note the "all" bucket's sky blue and the accent's near-black navy are both cool-hued but easily told apart by lightness and saturation — sky is bright and light, the accent is dark and desaturated:
- **All / Total Jobs — Sky** (#0ea5e9)
- **Applied — Indigo** (#6366f1, same as the secondary-action color — see Secondary action above)
- **In-progress — Amber** (#f59e0b)
- **Not interested — Slate** (#94a3b8)
- **Rejected — Rose** (#f43f5e)
- **Expired — Stone** (#78716c)
- Each bucket's hue appears identically across four places: the stat-card top bar, the stat-card icon chip, the bucket-filter pill, and the per-job status badge.

### Avatar palette (categorical, per company)
- Eight muted tint pairs rotate by a hash of the company name, so the same company always renders the same tile: rose, amber, sky, violet, blue, pink, stone, slate (each as `{hue}-50` background / `{hue}-700` text, except stone/slate which use `-100`/`-700` for enough contrast against white). Purely a differentiation aid — carries no status meaning. None of the eight avatar hues are navy or near-black, so a company avatar never gets mistaken for the accent-colored primary button or a selected-row indicator.
- Uses the paler 50-tint (not 100) specifically because the 100-tint version, combined with punchier hues like fuchsia/lime/cyan in the original rotation, read as too bright for a quiet white canvas — the avatar's job is differentiation, not attention.

### Neutral (does most of the work)
- **White** (#ffffff): The canvas and every card surface. Cards are separated from the page and each other by a 1px border, never a background-color jump.
- **Gray 100 / 200** (#f4f4f5 / #e4e4e7): Hover backgrounds, dividers, resting borders, chip backgrounds for neutral statuses.
- **Gray 400 / 500** (#a1a1aa / #71717a): Muted icons, secondary text, placeholder text.
- **Gray 600 / 700** (#52525b / #3f3f46): Body text, secondary-button fill.
- **Gray 900** (#18181b): Primary text and headings. Never pure black.

### Named Rules
**The One Hue, One Job Rule.** Score color, bucket/status color, the near-black navy accent, the muted-slate secondary-action color, and avatar color are five separate systems that never borrow each other's palette. A component that needs "this is good/bad" reaches for the score scale; a component that needs "this is the primary action" reaches for navy; a component that needs "this is a secondary action" reaches for slate, never plain gray; a component that needs "which bucket is this" reaches for the bucket palette; a component that needs "tell this row apart from its neighbor" reaches for the avatar palette. Mixing them, or collapsing a real action color onto neutral gray, or picking a hue that clashes with the accent, is what made earlier passes feel arbitrary or made buttons look disabled or off.

**The Distinct Bucket Rule.** All six bucket hues must be distinguishable from each other at a glance, at the size of a 4px top bar, without reading their label. Two buckets sharing a muted or desaturated version of "brownish-red" is a failure of this rule even if their hex values differ — pick fully saturated, hue-separated colors, not shades of the same neutral-adjacent tone.

**The Status-Color Consistency Rule.** Each pipeline status (Applied, In-Progress, Not Interested, Rejected, Expired) has exactly one color assignment, reused identically across the stat-card top bar, the icon chip, the filter pill, the per-row badge, and the status-picker menu.

## Typography

**Headline / Title Font:** Poppins (weights 500/600/700), with Geist Sans, ui-sans-serif, system-ui as fallback
**Body Font:** Geist Sans, with ui-sans-serif, system-ui as fallback

**Character:** Poppins carries just enough geometric warmth to feel considered rather than default, without becoming a display face — it's confined to headings (`h1`–`h4`, sitewide, via a plain CSS rule rather than a utility class). Geist Sans stays quiet everywhere else: labels, body copy, buttons, badges.

### Hierarchy
- **Headline** (700, 1.5rem / 24px, 1.3 line-height): Job title in the detail panel (`JobDetailHeader` `h2`). The largest text in the system — there is no larger "hero" scale.
- **Title** (600, 1.125rem / 18px, 1.4 line-height): Section headers like "Job Matches," profile section titles. `h2`/`h3` at this weight.
- **Body** (400–500, 0.875rem / 14px, 1.5 line-height): Job descriptions, list-row text, most UI copy. Body text runs at 14px sitewide, not 16px — deliberate density for a dashboard reviewed at a glance, not a reading surface.
- **Label** (500, 0.75rem / 12px): Stat-card labels, badge text, meta lines ("Posted 31 Jul 2026 · LinkedIn"), pagination text.

### Named Rules
**The Heading-Only Poppins Rule.** Poppins never appears in body copy, buttons, or badges — only `h1`–`h4`.

## Layout

Full-viewport app shell: a slim top nav (`h-14`, "Dashboard" / "Profile" only, left-aligned, no logo — this is a personal tool, not a branded product) sits above a scrollable main region and a one-line footer. The dashboard itself is a fixed-height flex column that fits the viewport exactly (stat cards → filter/search row → list-and-detail panel), with `overflow-hidden` on the outer shell and independent internal scroll on the job list and the job-detail description — the page itself never scrolls.

The list-and-detail pattern is the system's core layout primitive: a 40%-width scrollable list on the left, a 60%-width detail panel on the right, both inside one bordered, `rounded-lg`, `shadow-sm` container. This 40/60 split and the internal-scroll-not-page-scroll behavior are both the result of explicit user correction during development — not incidental defaults. Changing pages resets both the page-level scroll position and the internal job-list scroll to the top.

Content padding follows the `spacing` scale: `md` (16px) for card interiors and page gutters, `lg` (24px) for page-level vertical rhythm, `sm`/`xs` for tight internal groupings (badge padding, icon gaps).

Responsive behavior is modest: the stat-card grid steps from 2 columns (mobile) to 3 (sm) to 6 (lg); the list/detail split collapses to stacked full-width columns below `md`. This is a desktop-primary tool (PRODUCT.md: "primarily on desktop") — responsive behavior exists so the tool doesn't break on a smaller window, not as a first-class mobile experience.

## Elevation & Depth

Flat by default, with a single soft shadow tier for anything that floats above the canvas. Depth is conveyed through borders and neutral tonal contrast (white cards on a white canvas, separated by a 1px `border-earth-200` line) rather than shadow. `shadow-sm` is the ceiling for ordinary surfaces (stat cards, the list/detail container, dropdown menus); nothing reaches for `shadow-lg` or heavier in normal use.

### Shadow Vocabulary
- **Ambient card** (`shadow-sm`): Stat cards, the list/detail container, dropdown menus. The only shadow most of the UI ever uses.
- **Focus glow** (`shadow-lg shadow-clay-500/10`, plus `ring-2 ring-clay-500/20`): The search input's focused state — a navy-tinted glow, tying the focus treatment back to the accent color.
- **Deep** (`--shadow-xl`, a custom two-layer neutral shadow): Defined in the token system but not currently used on any shipped surface — reserved for a future modal or overlay.

### Named Rules
**The Border-Over-Shadow Rule.** Where a lighter design system would reach for a shadow to separate a card from its background, this system reaches for a 1px border first.

## Shapes

Generously rounded throughout — `rounded-lg` (8px) is the default for cards, dropdowns, and the list/detail container; `rounded-xl` (12px) steps up for stat cards, the company-avatar tile, and the search bar. Buttons and status controls sit at `rounded-md` (6px), a touch tighter than cards so they read as controls rather than containers. Badges, score pills, and pagination's active state are fully rounded (`rounded-full`).

Borders are hairline (1px) and low-contrast (`border-earth-200` at rest), stepping up to the navy accent only on selection or focus. There is no hard/neobrutalist edge anywhere, and no `border-left`/`border-right` accent stripes on cards — selection is shown via a full-border ring, not a colored edge. The one exception is the stat card's top bar, which is a deliberate flat color block, not a stripe on the card's reading edge.

## Components

### Buttons
- **Shape:** `rounded-md` (6px) — tighter than the card radius, marking buttons as controls.
- **Primary:** Near-black navy background, white text, `px-4 py-2`, `text-sm font-medium`. Used for the one clearly-primary action per view ("View Job Listing", "Generate Cover Letter").
- **Secondary:** Slate 500 background, white text, same shape and padding. Used for a second, still-important action ("View Resume", "View Cover Letter") — never used for the primary action, and never gray (gray read as disabled).
- **Hover / Focus:** Background steps one shade darker on hover; focus shows a ring with offset (`focus:ring-2 focus:ring-offset-2` on primary CTAs, a quieter `ring-1` on list-level controls like pagination and job cards). Transitions run at the default 150ms.
- **Icon-only / status buttons:** The job-status picker is a button whose background *is* the current status's semantic color (see Status-Color Consistency Rule) rather than a neutral button with a colored icon.

### Chips / Badges
- **Style:** `rounded-full`, `px-2.5 py-0.5`, `text-xs font-medium`, soft-tint background with matching darker text (never a saturated background with white text — badges are quiet by design).
- **Score badge:** The 4-band traffic-light scale — green ≥80, yellow 60–79, orange 40–59, red <40. Color alone tells the story; the number is a confirmation, not the primary signal.
- **Status badge:** One color per pipeline status (success/warning/error/neutral), shared with the filter pills and stat cards (see Named Rules above) — kept separate from the score scale so the two "green means good" meanings never appear on the same card.

### Cards / Containers
- **Corner Style:** `rounded-lg` (8px) default, `rounded-xl` (12px) for stat cards and the search bar.
- **Background:** White on white — cards are separated from the canvas by a 1px border, plus (stat cards only) a 4px colored top bar.
- **Shadow Strategy:** `shadow-sm` only; see Elevation & Depth.
- **Border:** 1px `border-earth-200` at rest; active/selected stat cards add a navy `ring-1` rather than changing the border color.
- **Internal Padding:** `md` (16px) is standard for card bodies.
- **Signature detail:** Stat cards carry a `h-1` solid color bar along the top edge (the bucket's `accentBg`) — a peripheral-vision identity cue that repeats the same bucket color used in the icon chip.

### Inputs / Fields
- **Style:** `rounded-xl` on the primary search field (an outlier from the `rounded-lg` card default), `border-earth-200`, white background with backdrop blur.
- **Focus:** Border shifts to navy-300, a ring appears, and the shadow warms from a neutral ambient shadow to a navy-tinted glow — the most elaborate focus treatment in the system; search is the one input that gets extra craft.
- **Elsewhere (legacy):** The resume-editing surfaces (`ResumeFormUI`, profile pages) currently use a separate, undocumented gray/slate/white palette rather than this system's tokens — a known inconsistency, not an intentional second design language.

### Navigation
- **Style:** A single slim top bar (`h-14`), left-aligned nav items with generous horizontal padding, no logo or wordmark. Active state is a soft navy-tinted pill (`bg-clay-50 text-clay-700`) with a slightly heavier icon stroke; inactive items are muted gray and darken on hover.

### Company Avatar (signature component)
A pastel-tint initials tile standing in for a company logo the app doesn't have — the company name hashes to one of eight rotating hues (rose/amber/sky/violet/blue/pink/stone/slate), so the same company always renders the same color and adjacent rows in the list are easy to tell apart. `rounded-xl`, two-letter initials, bold tracking-wide type. This is purely a wayfinding device — the color carries no status meaning, unlike the score badge next to it.

## Do's and Don'ts

### Do:
- **Do** keep the score scale (green→red) exclusive to the resume-match badge; nothing else borrows "green means good."
- **Do** keep the near-black navy exclusive to selection and the primary action, and the muted slate exclusive to secondary actions.
- **Do** let the company avatar rotate through its 8-hue palette freely — that rotation is intentional differentiation, not noise.
- **Do** reuse the exact same status color everywhere it appears (stat-card top bar, icon chip, filter pill, row badge, status picker).
- **Do** default to a 1px `border-earth-200` for card separation before reaching for a shadow.
- **Do** use the 40/60 list/detail split with independent internal scroll (not page-level scroll) for any new master-detail view in this app, and reset that scroll position on page change.

### Don't:
- **Don't** use the score scale's green/red for anything except the resume-match badge — it would compete with the navy accent or the status pastels.
- **Don't** put a colored `border-left`/`border-right` accent stripe on a card or list item; selection and emphasis are shown with full borders, rings, or background tint instead (the stat-card top bar is the one deliberate exception, and it's a flat block, not a side stripe).
- **Don't** reach for `shadow-lg` or heavier on routine surfaces; `shadow-sm` is the system's normal ceiling.
- **Don't** treat the resume-editing surfaces' gray/slate palette as a pattern to extend — it's unmigrated legacy code.
- **Don't** add a logo, wordmark, or branded chrome to the nav — this is a personal utility, not a product with a public identity.
