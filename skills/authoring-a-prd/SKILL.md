---
name: authoring-a-prd
description: >-
  Run this to turn a feature idea or brief into a house-style PRD BEFORE any branch is opened —
  whenever the user says "write a PRD", "help me write a PRD", "create a PRD for", "draft the
  requirements for", "spec this feature", "document this feature", "turn this brief into a PRD",
  or "publish this to the tracker". Also offer it proactively when the user describes a feature
  that needs documenting before build. It produces the PRD in the repo's PRD folder, seeds an epic
  plus one issue per user story in the issue tracker (only after explicit confirmation), pairs a
  decision record, then hands off to `starting-a-change`. The one rule: every product claim is
  grounded in a source the repo declares, never invented — a fabricated behaviour is the most
  expensive thing to discover after the build starts.
---

# Authoring a PRD

Most teams gate the *build* — `starting-a-change` → `pre-push-review` — but nothing gates **how a
feature is described** before that. PRDs get written ad hoc, drift in shape, and the backlog is seeded
by hand from memory. This skill is the **entry gate**: it produces a consistent, reviewable PRD, seeds
the tracker the same way every time, and hands the work to `starting-a-change`. The PRD is a proposal —
**you never push, merge, or deploy**; a human pulls every trigger.

The *shape* lives in the PRD template; the *product truth* lives in the sources the repo declares.
This skill is only the procedure that binds them.

## Configure for your repo

The skill expects to find these. `AGENTS.md` should say where each lives; the default is in brackets.

- **PRD folder** [`docs/prd/`] and a **PRD template** in it [`docs/prd/_template.md`]. If the repo has
  none, copy `TEMPLATE.md` from this skill's folder into place first.
- **Product context** [`docs/prd/_context.md`] — what the product is, the real user roles, the
  glossary (the terms PRDs most often get wrong), and where truth lives.
- **Sources of product truth** — whichever the repo declares: a capabilities file that marks each
  capability as shipped, proposed, or unsupported; a per-feature reference with architecture, data
  model, and caveats; and the code itself. If none is declared, the code is the only source.
- **Analytics event catalogue** [`docs/analytics-events.md`] — the events the product actually emits,
  and which analytics tool records them. If missing, name new events but flag them as new.
- **Decision records** [`docs/decisions/YYYY-MM-DD-slug.md`, template `docs/decisions/_template.md`].
- **Issue tracker** — Linear, GitHub Issues, Jira, or none; read from `AGENTS.md`. Optional: a
  roadmap file [`ROADMAP.md`] if the repo keeps one.

## Step 0 — Ground in the product

Before drafting anything, read the product context, then every source of truth the feature touches:
the capabilities file entries, the feature-reference section, the relevant code paths, and the event
catalogue.

**The rule:** never state the product does something you can't trace to a source the repo declares.
If a capability is proposed, unsupported, or simply unconfirmed, it goes in **Open Questions** or is
written as an explicit API expectation — not as settled behaviour. Engineers build what the PRD says;
a behaviour you invented becomes a sprint of work nobody planned.

## Step 1 — Detect mode and gather

**Brief mode** — the user pasted a brief or feature description: move straight to drafting. Extract
everything you can; park gaps in **Open Questions** rather than blocking on a back-and-forth.

**Coaching mode** — the user said something vague ("help me write a PRD"): ask these six at once (one
message, not a drip):

1. What is the feature or capability? (a paragraph is enough)
2. What problem does it solve, and who has it today?
3. Who are the users? (which of the product's real roles, or a specific surface?)
4. What is the new behaviour you want? (rough is fine — polished ACs come later)
5. Any config, flags, limits, or integration/key gating involved?
6. Any open questions or things you're unsure about?

## Step 2 — Draft the PRD

Copy the template and fill every section — `TBD` or an Open-Questions row if unknown, never a deleted
section. A missing section reads as "not applicable"; a `TBD` reads as "not decided yet". The **user
stories are the heart**; get these exactly right:

- **Story statement** — `> _As a [role], I want [goal], so that [benefit]._` Role is a real role from
  the product context, not an invented persona or hierarchy.
- **Background** — prose, no bullets. The "why" and the mechanic an engineer needs before the ACs. If
  it leans on a capability, say whether that capability is shipped or a proposed expectation.
- **Fields** table — every data field the story introduces or uses, with type and notes.
- **Events** table — product-analytics events, `snake_case`, naming *what happened*
  (`widget_created`, not `create_widget`). At least one **Entry**, one **Success**, a **Warning**, a
  **Failure**. Cross-check names against the event catalogue; reuse an existing event before
  inventing a near-duplicate.
- **Acceptance Criteria** — `AC-S[story#]-[seq]`, restarting per story (`AC-S1-001`, `AC-S2-001`, …).
  Each: **Path** (Success / Warning / Failure / Interaction), **Given**, **When**, **Then**. Every
  **Then** ends with the event it emits — e.g. `; widget_created is emitted`. 4–8 ACs per story
  covering happy path, key edge/error cases, and permission/access.

Present the draft in the conversation. Then ask whether to **write it to the PRD folder** now or
review and edit first. Writing the file is safe; seeding the tracker is a separate,
explicitly-confirmed step (Step 3) — a "yes" here never authorizes the external write.

## Step 3 — Publish (write the file, then seed the tracker)

**Write the PRD** to `<prd-folder>/<slug>.md` (`<slug>` = kebab-case feature name), status
`Draft for review`.

**Seeding an issue tracker (Linear, GitHub Issues, Jira) is an external, side-effectful write —
confirm before doing it.** Do not create any issue until the user says go in this conversation, for
this PRD. Approval in one message does not carry to the next. Then:

1. Fetch the taxonomy **live** — teams, projects, labels, statuses (via the tracker's MCP or CLI, e.g.
   `gh label list` for GitHub). Never hardcode label/status/project names — they are not in the repo
   and they change.
2. Create the **epic** (or parent issue / milestone, whatever the tracker calls it) — title = the
   feature; description = the PRD's Problem + Goal + a link to the PRD file.
3. Create **one child issue per user story**, parented to the epic — title = the story title; body =
   that story's Background + ACs. This is where the granular spec lives.
4. Backfill the issue ids into the PRD header's `**Tracking:**` field and the
   **Requirement → Story → Issue** table.

If the tracker's tool needs re-auth in this session, or the repo has no tracker, say so plainly, write
the PRD file anyway, and leave the tracking ids as `TBD` for the user to wire up — **never fabricate
ids**.

## Step 4 — Pair the decision record, then hand off

- **Decision record** — create `docs/decisions/YYYY-MM-DD-<slug>.md` from the decision template
  (status `Proposed`) capturing the core decision the PRD commits to, and link it in the PRD header's
  `**Decision:**` field.
- **Roadmap** — if the repo keeps a roadmap file, add an entry for the feature referencing the epic
  id, so the build has a home in the plan.
- **Hand off** — the PRD is done. `starting-a-change` is the matching **entry gate for building it** —
  run it to open the branch for the first story.

## Definition of done

- [ ] Grounded in the product context and declared sources of truth; no product claim is invented (unconfirmed → Open Questions)
- [ ] PRD written to `<prd-folder>/<slug>.md` from the template, every section present or `TBD`, status `Draft for review`
- [ ] Every user story has Background (prose), Fields, Events (Entry/Success/Warning/Failure), and 4–8 ACs
- [ ] AC codes follow `AC-S[N]-[NNN]`, restart per story, and every **Then** emits an event
- [ ] Roles are real roles from the product context — no invented personas or hierarchy
- [ ] Tracker seeded only after explicit user confirmation: epic + one child per story; ids backfilled (or left `TBD` if unavailable)
- [ ] Decision record created and linked; roadmap entry added if the repo keeps one
- [ ] Handed off to `starting-a-change`; nothing pushed, merged, or deployed

## How this goes wrong

- **Invented behaviour.** The draft says the product "already syncs X" because it sounds plausible.
  Nobody checks until the build, where it turns out to be a proposed capability — and the estimate
  was wrong from day one. Trace every claim or move it to Open Questions.
- **Shape drift.** Old PRDs written before the template look authoritative. Read them for product
  grounding, not for structure; the template defines the shape.
- **Silent tracker writes.** "Yes, write the PRD" is not "yes, create twelve issues". Ask separately.
