---
name: mobile-responsive-review
description: >-
  Run this BEFORE pushing any branch that changes UI in a Tailwind app — as a step of
  `pre-push-review`, or directly when the user says "is this responsive?", "check mobile", "does this
  work on a phone?", or ships a new page, panel, dialog, table, toolbar or layout. It scans the diff's
  added markup for the patterns that break at phone width (360–430px), checks the fixes leave desktop
  (>= 768px) unchanged, and drafts the `max-md:` fixes in the same PR. People open your product on
  phones; a page that only works on a laptop ships broken for them. This is a blocker with an
  explicit opt-out; do not skip to `git push`.
---

# Mobile responsive review

Making an existing app usable on phones is usually one big pass of `max-md:` class additions across
hundreds of files. Every new page that ships desktop-only undoes a little of that pass. This skill is
the check that keeps a new surface from regressing it, and it carries the traps that pass hit so you
don't rediscover them in review.

> **This is a blocker.** A UI diff that breaks at phone width does not get pushed.
> **The opt-out is explicit, not silent:** put one line in the PR body —
> `Mobile impact: none — <reason>` (no visible layout change), or
> `Mobile: desktop-only — <reason>` (a surface that genuinely can't work on a phone, e.g. a
> drag-and-drop canvas editor) — and the gate is green.

## Configure for your repo

- **Tailwind**, with the default `md` breakpoint (`48rem`, 768px). The scanner and fixes assume
  `max-md:` / `max-sm:` variants exist (Tailwind v3.2+; the traps below are written for v4).
- **Base branch** — read from `AGENTS.md`; default `origin/main`. Pass it to the scanner with
  `--base <ref>` or `MOBILE_SCAN_BASE`.
- **UI roots** — default `app`, `components`, `src`. Override with `--dirs a,b` or `MOBILE_SCAN_DIRS`.
- **Exempt surfaces** — dev/preview/test routes that never ship. List them in `AGENTS.md` and pass
  each as `--skip '<regex>'` (or comma-separated in `MOBILE_SCAN_SKIP`). Tests and stories are always
  skipped.
- **What your app shell already does on phones** (drawer nav, gutters, phone-safe table and dialog
  primitives) — note it in `AGENTS.md` so reviewers don't redo it. See "Know what's already handled".
- `docs/standards/STANDARDS.md` — COMP-01 (accessible primitives) and HYG-02 (visible change
  evidence) are referenced below; stated in words if the file is missing.

## The contract

- **Phone** = below Tailwind's `md` breakpoint (`48rem`, 768px). Target 360–430px wide.
- **Desktop must not change.** At >= 768px every computed style stays exactly as it was. So fix phone
  layouts by **adding `max-md:` / `max-sm:` classes**, not by rewriting base classes. A base-class
  change is only acceptable if it renders identically at >= 768px (e.g. `grid-cols-1 md:grid-cols-3`
  replacing `grid-cols-3`).
- **This is a code-reading check.** No browser needed; the reviewer confirms in devtools device mode
  (Step 6).

## Step 1 — Know what's already handled

Before flagging anything, find out what the app already does below `md`, so you don't redo it:

- Does the app shell move the sidebar into a drawer behind a top bar? Do page gutters shrink?
- Do the shared `Table` / `Dialog` primitives already wrap in `overflow-x-auto` or cap width at
  `calc(100% - 2rem)`? (shadcn's `Table` scrolls; its `DialogContent` caps width — but see the
  `max-w-*` trap.)
- Does a widget/card grid already stack below `md`?

Pages **outside** the shell — auth, onboarding, invite, public share links (often opened on a phone),
docs, admin — own their whole layout and get none of it. Read them more carefully.

## Step 2 — Does this diff have mobile impact?

Fires on any change to layout-bearing UI: `.tsx`/`.jsx`/`.css` under the UI roots that adds or
changes markup, classes or inline styles.

Does **not** fire on: logic-only changes, copy-only changes, backend code, utilities without markup,
tests, and the exempt dev/preview surfaces. Watch for a preview file that a live route actually
renders — that one is not exempt.

If nothing fires, write `Mobile impact: none — <reason>` in the PR body and stop.

## Step 3 — Run the scanner

```sh
node <skill-dir>/scripts/mobile-scan.mjs                      # vs origin/main
node <skill-dir>/scripts/mobile-scan.mjs --base origin/develop --skip '^app/dev-'
```

Run it from the repo root. It reads only the **added lines** of the diff — committed, uncommitted and
untracked — and reports two things:

1. **Risk hits** — patterns that commonly break at phone width, each with `file:line`. A hit is a
   prompt to read the code, not a verdict: a `w-[480px]` inside a popover that already has
   `max-w-[calc(100vw-2rem)]` is fine.
2. **Desktop-changing hunks** — hunks where removing every `max-md:`/`max-sm:`/`sm:max-md:` token
   does **not** give back the removed lines. Each one must be read and shown identical at >= 768px
   (or be net-new markup, which is expected for new features).

It always exits 0. You decide what's a blocker.

## Step 4 — Read each surface at 390px in your head

For every page/panel/dialog the diff touches, walk it top to bottom at ~390px and check:

| Check | Typical fix |
|---|---|
| Multi-column grids (`grid-cols-3+`, `grid-cols-[...]`) | `max-md:grid-cols-1` (or `-2` for small stat tiles) |
| Side-by-side panes: list \| detail, content \| rail, form \| preview | `max-md:flex-col`; rail `max-md:w-full`; or move the rail into a stacked strip |
| Fixed widths `w-[Npx]`, `min-w-[Npx]`, inline `width: N` wider than ~340px | `max-md:w-full` / `max-md:min-w-0`; inline → `` `min(${N}px, calc(100vw - 2rem))` `` |
| Rows with `justify-between` and several children (title + buttons, filters) | `max-md:flex-wrap` or `max-md:flex-col max-md:items-stretch` |
| Toolbars / tab bars / pill groups | `max-md:flex-wrap` or `max-md:overflow-x-auto` |
| Hand-rolled `<table>` not inside a phone-safe `Table` | wrap in `overflow-x-auto`; optionally `max-md:hidden` low-value columns (th **and** td) |
| Big padding `p-8`, `px-10`, `pt-[100px]` | `max-md:p-4` / `max-md:px-4` |
| `h-screen`, fixed `h-[Npx]`, inline heights that trap content | `max-md:h-auto` (inline heights need `max-md:h-auto!`) |
| Long unbroken text: emails, IDs, URLs, file names, formulas | `min-w-0` on the flex child + `break-words` / `break-all` / `truncate` |
| Hover-only actions (`opacity-0 group-hover:opacity-100`) | `max-md:opacity-100` — touch has no hover |
| Text inputs/textareas under 16px | `max-md:text-[16px]` — iOS Safari zooms the page on focus otherwise |
| Label \| control rows in forms | stack them below `md`; keep switches inline |

And the things a phone user must still be able to do:
- **Don't hide functionality without an alternative.** `max-md:hidden` on a secondary rail is fine
  only if what it offered is reachable another way. A project-switcher rail hidden on phones was the
  *only* way to switch projects; it had to be restacked as a strip instead.
- **Hidden labels need a replacement.** If a header row goes `max-md:hidden` over stacked inputs, give
  each input an `aria-label` (COMP-01), or a small `md:hidden` visible label.
- **Icon-only buttons you make visible on touch need an `aria-label`** — `title` is never shown on touch.

## Step 5 — The traps (each one costs a review round)

- **`max-*` variants sort BEFORE `sm:`/`md:` in Tailwind v4.** `sm:grid-cols-5 max-md:grid-cols-2`
  gives 5 columns at 640–767px — the `sm:` rule wins. Use `max-md:grid-cols-2!` or
  `sm:max-md:grid-cols-2`.
- **Tailwind v4's important modifier is a trailing `!`** (`max-md:h-auto!`). Needed when:
  - the base comes from an **unlayered custom class** — design-system type classes such as
    `.text-body-small` defined outside `@layer` beat any layered utility, so `max-md:text-[16px]`
    silently does nothing without `!`;
  - the base is an **inline `style`** height/width.
- **`max-w-*` on shadcn `DialogContent` replaces its `max-w-[calc(100%-2rem)]`** — a `max-w-2xl`
  dialog runs edge to edge on a phone. Add `max-md:max-w-[calc(100%-2rem)]`.
- **Match the breakpoint of what you replace.** If desktop content is `hidden lg:flex`, a phone
  fallback that is `md:hidden` leaves 768–1023px with neither — use `lg:hidden`.
- **JS breakpoints must match CSS ones.** A hook that compares `innerWidth` in px drifts; CSS `md`
  is `48rem`, which moves with the browser's font size. If JS and CSS both gate the same UI, use
  `matchMedia("(max-width: 47.999rem)")` — otherwise a user with a larger font gets CSS-hidden UI
  and no JS replacement.
- **Scroll containers with `overflow-x-auto` also clip y.** Add `overflow-y-hidden` and mind 1px
  underlines/focus rings that sit just outside the box.
- **Design-system internals.** Styling a DS part through its `data-slot` hook
  (`[&_[data-slot=...]]:`) is consuming, not forking — but it isn't a versioned API. List it in the
  PR body as a DS backlog item so it gets upstreamed to the design system. Never copy DS source to
  make it responsive.
- **Stacking.** Page elements with `z-50` (a sticky banner) can paint over a mobile drawer. If the
  shell's `<main>` is `max-md:isolate` for that reason, don't remove it.

## Step 6 — Draft the fixes, then record it

- Fix every real hit in this branch with `max-md:`/`max-sm:` additions. Re-run the scanner until
  the remaining risk hits are ones you've read and judged fine, and every desktop-changing hunk is
  justified.
- In the PR body, add a **Mobile** line:
  - `Mobile: checked — <what adapts on phones>` (e.g. "filters wrap, table scrolls, detail rail
    stacks below the chart"), plus any DS backlog items and anything deliberately left desktop-only;
  - or one of the opt-outs above.
- Tell the reviewer how to confirm: *devtools → device mode → iPhone 14 (390px), open the menu,
  compare >= 768px against the base branch.*

## Definition of done
- [ ] Diff assessed; a no-impact / desktop-only call is stated in one line in the PR body
- [ ] Scanner run; every risk hit read, fixed or judged fine
- [ ] Every desktop-changing hunk is net-new markup or shown identical at >= 768px
- [ ] No functionality hidden on phones without an alternative; hidden labels replaced
- [ ] Traps checked: `max-*` vs `sm:` ordering, trailing `!`, dialog `max-w-*`, breakpoint parity
- [ ] DS `data-slot` overrides (if any) listed as DS backlog in the PR body
- [ ] `Mobile:` line in the PR body
