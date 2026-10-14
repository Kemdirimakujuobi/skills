---
name: docs-sync-review
description: >-
  Run this BEFORE pushing any branch that changes what a user can see or do in the product — as a
  step of `pre-push-review`, or directly when the user says "does this need docs?", "update the help
  section", "check the docs", or ships a feature, a new metric, a new widget, a renamed field or a
  changed calculation. It maps the diff to the affected docs page, names what the page now gets
  wrong, and drafts the fix in the same PR. Docs are the product's self-serve answer; a page that
  describes last month's behaviour is worse than no page, because a reader trusts it. This is a
  blocker with an explicit opt-out; do not skip to `git push`.
---

# Docs sync review

User-facing docs are written by hand, so nothing keeps them honest when the product moves. Code
review checks the code; nobody checks that the help page still describes it. This skill is that
check, run before the push, with the fix drafted in the same PR.

> **This is a blocker.** A user-visible change with a stale doc page does not get pushed.
> **The opt-out is explicit, not silent:** put a line in the PR body —
> `Docs impact: none — <reason>` — and the gate is green. Declining is fine; declining *invisibly*
> is what rots the docs.

## Configure for your repo

The skill expects to find, in order of preference:

- **`docs/docs-map.md`** — the repo's own map of code globs to doc pages (format in Step 2). If it
  doesn't exist, use the fallback in Step 2 and offer to create the map in this PR.
- **`AGENTS.md`** — where the docs live (a `docs/` folder, an in-app help route, a docs site), the
  base branch, and the typecheck/build script. Default base: `origin/main`.
- **The docs' own conventions** — how a page declares its title, table of contents, search keywords
  and nav entry. Read one existing page and the nav/registry file before editing; copy what they do.
- **`docs/standards/STANDARDS.md`** — HYG-01 (PR size) and HYG-02 (light + dark screenshots) are
  referenced below. If it's missing, the rules are stated in words where they're used.
- Verification: `npm run preflight` if it exists; otherwise typecheck, lint and build, using the
  script names in `package.json`.

## Step 1 — Does this diff have user-visible impact?

The bar: **would a reader of the mapped page now be misinformed?**

Fires on — a new metric, widget, filter, view or page; a renamed field or label; a changed default;
a changed calculation or threshold; a new integration or setup step; a removed capability; a changed
error or empty state.

Does **not** fire on — refactors with identical behaviour, tests, types, logging, performance work,
dependency bumps, generated code, seed/backfill scripts, internal admin and test-only routes, shared
UI primitives, agent config (`.claude/**`), and the docs themselves. If the repo's map lists a
never-fires set, use that list instead.

If nothing fires, say so in one line and move on. Do not manufacture a docs change.

## Step 2 — Map the changed paths to a doc page

```sh
git diff --name-only <base>...HEAD
```

**The repo keeps its own map.** It lives in `docs/docs-map.md` as a table of code globs to doc pages.
Read it left to right; a file can hit more than one row. **The map is the contract — when you add a
code area that isn't in it, add the row in the same PR.** An illustrative shape:

| Changed path | Doc page |
|---|---|
| `src/billing/**` · `app/settings/billing/**` | `account/billing` |
| `src/reports/metrics/**` · `lib/metric-definitions.ts` | `reports/metrics` |
| `components/reports/widgets/**` | `reports/widgets` |
| `src/integrations/<name>/**` | `integrations/<name>` (plus `integrations/overview` if setup changed) |
| `src/notifications/**` | *Planned: Notifications* — no page yet (Step 4b) |
| `src/public-api/**` | Not the help docs — the API reference in `docs/api/`; owes an update there, `Docs impact: none — API reference updated` for this gate |

Keep three kinds of row in it: pages that exist, sections that are **planned but unwritten**, and
areas the help docs **deliberately don't cover** (with where they *are* documented). The third kind
still owes an update — just to a different file.

**No map, or a path in no row?** Fall back to searching the docs for the changed feature's
user-facing names — the labels, page titles, metric names and setting names that appear in the UI
strings of the diff:

```sh
grep -rniE "<label>|<metric name>|<setting name>" <docs dir>
```

Then judge against the docs' page descriptions. If the change genuinely belongs to a new section,
say so — don't force it into the nearest page. Either way, add the row you just worked out to the
map.

## Step 3 — Read the page and name the gap

Open the mapped page in full. State the gap as a **quotable defect**, not a topic:

> `reports/metrics` says conversion rate is "qualified leads ÷ closed leads". This branch changes the
> denominator to booked leads. The page is now wrong, not just incomplete.

"The metrics page should mention this" is not a finding. If you cannot quote what the page now gets
wrong or fails to mention, there is no gap — say so.

## Step 4a — Existing page → draft the edit

Edit the page directly, in this branch.

- **Match the page's voice.** Usually second person, present tense, plain words. Read the
  surrounding paragraphs before writing; these pages explain to a user, not an engineer.
- **Use the docs' own building blocks** — the prose components, MDX components or Markdown
  conventions the other pages use. Never raw HTML or ad-hoc styling where a component exists.
- **Mark what the reader clicks** the way the other pages do (a UI-label component, bold), and
  literal values as code.
- **New heading with an anchor → add it to the page's table of contents**, in document order, if the
  docs keep one by hand. The heading id and the TOC id must match exactly, or "On this page" silently
  breaks.
- **New vocabulary the reader might search → add it to the page's keywords**, if the docs have them.
- Leave a video slot only where a recording actually exists or is planned; an empty embed is a worse
  answer than prose.

## Step 4b — Planned section → create the page

The change belongs to a planned, unwritten section. Write the page now, in this branch.

1. **Create the page** by copying the shape of the cleanest existing page — every export or
   front-matter field it has (title, description, keywords, TOC, body). The description is one
   sentence naming **the question the page answers**; it usually feeds search, nav and `<meta>`.
2. **Register it in the nav** (registry file, sidebar config, `_meta` file — whatever the docs use).
   **A page that isn't in the nav doesn't exist.** **Ordering is reading order, not alphabetical** —
   the nav is a curriculum and prev/next walks it top to bottom, so place the page where a reader
   would meet it.
3. If this is the section's **first** page, add the section and **remove it from wherever planned
   sections are listed** — leaving it in both advertises the page as unwritten while it sits in the
   nav. Update the map row from *Planned* to the page.
4. Cover the feature the branch actually shipped. **Do not document the rest of the section from
   imagination** — an invented behaviour is the most expensive thing to discover after the fact. What
   you did not verify in the code does not go on the page; note the remaining gaps in the PR body.

> A whole new page is a real addition to the diff. If it pushes the PR past HYG-01 (~25 files /
> ~1500 lines) or genuinely splits the concern (HYG-03), say so and offer the user the choice — page
> now, or `Docs impact: none — new <section> page, follow-up PR` and a separate branch. Their call,
> made out loud.

## Step 5 — Verify

If the docs keep a hand-written TOC, check every TOC id has a matching heading id (and the reverse).
Adapt the patterns to how your pages declare them:

```sh
grep -oE 'id: "[^"]+"' <page> | sort > /tmp/toc.txt
grep -oE '<H2 id="[^"]+"' <page> | grep -oE '"[^"]+"' | sed 's/^/id: /' | sort > /tmp/h2.txt
diff /tmp/toc.txt /tmp/h2.txt && echo "toc OK"
```

- New page? Confirm it renders at its route, appears in the nav, and prev/next resolves.
- Run the typecheck/build — a missing nav import or a bad page shape fails there, not at runtime.
- Docs pages are visible UI: a **new page** owes light + dark screenshots in the PR body (HYG-02).
  Edits to existing prose do not.

## Definition of done
- [ ] Diff assessed against the user-visible bar; a no-impact call is stated in one line
- [ ] Changed paths mapped; any unmapped code area added to `docs/docs-map.md` in this PR
- [ ] Gap named as a quotable defect, not a topic
- [ ] Edit drafted in this branch — existing page updated, or new page created **and in the nav**
- [ ] TOC ids match heading ids; new vocabulary in keywords
- [ ] First page of a planned section? Section no longer listed as planned
- [ ] Nothing on the page that was not verified in the code
- [ ] Typecheck/build green; new page has light + dark screenshots (HYG-02)
- [ ] Declined instead? `Docs impact: none — <reason>` is in the PR body
