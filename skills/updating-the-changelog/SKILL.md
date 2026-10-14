---
name: updating-the-changelog
description: >-
  Run this BEFORE pushing any branch or opening any PR in a product with a customer-facing
  changelog — invoked as a step of `pre-push-review`, or directly whenever the user says "update
  the changelog", "add this to the changelog", "what's new", or ships a feature, integration,
  metric, setting or customer-visible fix. It decides whether the change earns a changelog entry,
  writes the entry in the same PR, and records the decision in the PR body. The changelog is only
  true if every PR updates it; a skipped one is a feature customers never hear about. This is a
  blocker with an explicit opt-out (`Changelog: none — <reason>`); do not skip to `git push`.
---

# Updating the changelog

The changelog lists every customer-visible change, newest first. Its content lives in one place and
the entry ships **in the same PR as the change**, so the changelog and the product can't drift apart.
Written later, it never gets written.

## Configure for your repo

- **Changelog location** — `AGENTS.md` declares it (a Markdown file, or a data file a page renders).
  Default: `CHANGELOG.md` at the repo root, newest entry at the top.
- **Entry shape** — follow whatever the existing entries use. If starting fresh, use the fields in
  Step 2: date, kind, title, body, PR numbers.
- **Product name and UI names** — use the names customers see, as the product context or UI states.
- **Changelog check** — if the repo has a test or lint for the changelog (`package.json` scripts, often
  part of `npm test`), run it. If not, check the rules in Step 3 by eye.
- **Base branch** — from `AGENTS.md`; default `main`.

## Step 1 — Does this PR earn an entry?

Read the diff (`git diff origin/<base>...HEAD --stat`, then the parts that matter) and the PR title.

**Yes** — the change is something a customer can see or do:
- a new page, feature, integration, metric, setting, filter, export or AI capability (`new`)
- an existing one that now works noticeably better or differently (`improved`)
- a bug a customer could have noticed — wrong numbers, duplicates, something that didn't load (`fixed`)

**No** — say so in the PR body (Step 4) and stop:
- internal tooling: admin panels, staff-only dashboards, support bots, back-office workflows,
  billing allowlists, staff-only access grants
- refactors, performance work with no visible effect, query-limit or pagination fixes, error-tracker
  noise, tests, CI, docs-process, skills, retros, dependency bumps
- a feature behind a flag or env var that is **not live yet** — add the entry in the PR that turns
  it on
- a change that is reverted before it merges, or reverted the same day — an entry for a feature that
  vanished a few hours later is worse than no entry

When unsure, ask one question: **would a customer notice if this line were missing from the
changelog?** If no, it's `none`.

## Step 2 — Write the entry

Add one entry to the **top** of the changelog (newest first). In a data file it looks like:

```ts
{
  date: "YYYY-MM-DD",          // the day this PR is expected to merge
  kind: "new",                 // "new" | "improved" | "fixed"
  title: "Sales imports from a new CRM",
  body: "Pick the CRM under Settings → Import sales to load its export, next to the existing ones.",
  prs: [123],                  // this PR's number; add it after `gh pr create` if not known yet
},
```

In a Markdown file, the same fields as a dated heading and one line per entry.

House style:
- **Title** — the thing, not the work: `Custom roles`, not `feat: add custom roles`. No area
  prefix, no trailing period, ≤ ~7 words.
- **Body** — one or two sentences a customer understands: what they can now do and **where**
  (`Settings → Team → Roles & Permissions`). Plain language — no table names, function names,
  indexes, storage limits, or PR jargon.
- **Ground every claim in the diff.** Describe only what the code does. Don't promise a
  capability the PR doesn't ship (a disabled card, a staged index, an admin-only launch).
- **Public page.** Never name a customer, a staff member, an email address, or an internal URL.
- **Names as customers see them.** The product by its product name; integrations by their UI name,
  not the vendor's legal name.
- **One entry per change.** If this PR extends a feature that already has an entry from the same
  week, fold it in: add the PR number to that entry and adjust its body, rather than adding a
  near-duplicate line. A PR number appears on at most one entry.

## Step 3 — Check it

Run the repo's changelog check if it has one. Either way, the entry must have: a `YYYY-MM-DD` date, a
known kind (`new` / `improved` / `fixed`), non-empty title and body, at least one PR number,
newest-first order, and no PR credited twice.

## Step 4 — Record the decision in the PR body

Exactly one of these lines:

- `Changelog: added — "<title>"` (or `updated — "<title>"` when folded into an existing entry)
- `Changelog: none — <reason>` (e.g. `none — admin-only tooling`, `none — internal refactor`)

**Declining is fine; declining silently is how the changelog stops being true.**

If the PR number wasn't known when you wrote the entry, open the PR, then add the number to the entry
and push a follow-up commit on the same branch before asking for review. Pushing your own feature
branch is fine; never push to the base branch or merge.

## Backfilling

To catch the changelog up with merges it missed, list first-parent merges on the base branch since
the newest entry's date:

```sh
git fetch origin <base>
git log origin/<base> --first-parent --since=<newest-entry-date> --format='%ad %s|%b' --date=short \
  | sed -E 's/Merge pull request #([0-9]+) from [^|]*\|/#\1 /'
```

Apply Step 1 to each, read the PR body (`gh pr view <n> --json body`) before writing its entry, and
group related PRs into one entry.

## Definition of done

- [ ] Decided entry vs `none` against Step 1
- [ ] Entry (if any) at the top of the changelog, in house style, grounded in the diff, PR number recorded
- [ ] Changelog check passes (or the Step 3 rules hold by eye)
- [ ] `Changelog:` line in the PR body
