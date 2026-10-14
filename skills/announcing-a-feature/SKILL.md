---
name: announcing-a-feature
description: >-
  Run this BEFORE pushing any branch or opening any PR in an app that has an in-app "what's new"
  modal — invoked as a step of `pre-push-review` right after `updating-the-changelog`, or directly
  when the user says "announce this", "add a feature modal", "show users what's new", or ships a
  new page or workflow people would otherwise miss. It decides whether the change earns a modal
  (rarely), writes the entry and graphic in the same PR, prunes old entries, and records the
  decision in the PR body. A modal for everything trains people to dismiss it. This is a blocker
  with an explicit opt-out; do not skip to `git push`.
---

# Announcing a feature

An in-app announcement is one modal: a graphic, a sentence or two, and a button that takes the
person to the feature. It is the loudest thing the product can say, so it is spent rarely. The
changelog records everything customer-visible; the modal is only for what someone would **miss**.

**The default is no modal.** A changelog `new` line is not enough on its own.

## Configure for your repo

- **Announcements file**: `AGENTS.md` names it (for example `lib/feature-announcements/entries.ts`)
  and the folder its graphics live in. The modal component only reads this file.
- **Seen state**: closing the modal stores the announcement's id on the user record, not in
  browser storage, so it doesn't reappear on another device.
- **Retention window**: how long an entry stays (default 45 days). The dashboard imports the file,
  so it must not grow without a bound.
- **Check**: the repo's test for the file (shape, order, unique ids, image exists, within the
  window). Run it if present; otherwise check those rules by eye.

If the app has no announcement modal, skip this skill and write nothing in the PR body.

## Step 1 — Does this PR earn a modal?

Read the diff and the changelog decision from `updating-the-changelog`.

**No.** Write `Feature modal: none — <reason>` in the PR body and stop:

- a fix, an improvement, or anything that isn't a customer-visible `new` change
- a small setting, a label, or anything a person would find on their own
- a feature behind a flag or env var that **isn't live yet**: add the modal in the PR that turns
  it on
- internal tooling: admin panels, support tools, back-office workflows
- the announcement system itself, while its catalogue is empty

**Yes**, only when someone would miss the feature or has to go looking for it: a new page, a new
workflow, or something that changes where they work.

## Step 2 — Write the entry

Add one object at the **top** of the announcements list (newest first):

```ts
{
  id: "custom-roles",                 // a slug, never reused
  date: "YYYY-MM-DD",                 // the day this PR is expected to merge
  title: "Custom roles",
  body: "One or two sentences on what they can do and where.",
  actionLabel: "Open roles",
  href: "/settings/team",             // an in-app path starting with /
  image: "/feature-announcements/custom-roles.webp",
  imageAlt: "The roles screen with a custom role selected",
},
```

Then remove every entry dated more than the retention window before this one, and delete its
graphic. Git history keeps the old copy; the changelog is the record that stays.

House style matches the changelog:

- **Title**: the thing, not the work. No area prefix, no trailing period.
- **Body**: one or two sentences a customer understands, including **where** it lives.
- **Graphic**: a file the author supplies, or a cropped after-screenshot from the PR's evidence if
  the author says that's the graphic. **Never invent an illustration.** A missing file means the
  entry isn't done.
- **Ground every claim in the diff.** Customer language, product names as customers see them.

## Step 3 — Check it

Run the repo's announcement test. It should enforce the shape, newest-first order, unique ids,
that each image file exists, and that every entry is inside the retention window. If the repo has
no test, check those five by eye and suggest adding one in a separate PR.

## Step 4 — Record the decision in the PR body

Exactly one of:

- `Feature modal: added — "<title>"`
- `Feature modal: none — <reason>`

## Definition of done

- [ ] Decided modal vs `none` against Step 1
- [ ] Entry (if any) at the top, graphic committed, entries outside the window removed
- [ ] The announcement check passes
- [ ] A `Feature modal:` line in the PR body

## How this goes wrong

- **Every `new` becomes a modal.** People learn to close it unread, and the one that mattered is
  missed.
- **The graphic is invented.** An illustration of a feature that doesn't look like that is a
  promise the product breaks the moment they click.
- **The modal ships before the feature is live.** People click through to something they can't
  use.
