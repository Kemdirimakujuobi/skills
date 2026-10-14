# PRD — [Feature name]

**Status:** Draft for review · **Owner:** [PM] · **Tech lead:** [TBD] · **Design:** [TBD]
· **Tracking:** [epic id] ([first child id…last child id]) · **Decision:** [`docs/decisions/YYYY-MM-DD-slug.md`](../decisions/YYYY-MM-DD-slug.md)

> This is the house PRD template. Every section below is required — if a fact isn't known yet,
> write `TBD` or move it to **Open Questions** rather than deleting the section. Delete this
> quote block and the `<!-- guidance -->` comments before publishing. Keep the spine (Problem →
> Stories → ACs); product claims must trace to the sources of truth the repo declares.

---

## Problem / Context

<!-- 2–4 paragraphs of prose, no bullets. What is true today, who it affects, why it's worth solving
now. This is what a stakeholder reads to understand why the work exists. -->

---

## Goal / Objectives

<!-- 2–4 bold one-liners, each a thing that will be true when this ships. -->

1. **[Objective]** — [one sentence].
2. **[Objective]** — [one sentence].

---

## Success Metrics

| Metric | Target | Tracked By |
| --- | --- | --- |
| [what we measure] | [target or `TBD`] | [analytics tool / data] |

<!-- 2–5 measurable metrics. Name the analytics event or property where you can. -->

---

## Scope

**In scope**
- [thing this PRD covers]

**Out of scope**
- [thing explicitly excluded — this prevents scope creep with engineering]

---

## Current vs Desired behaviour

**Current** <!-- what happens today, before this feature -->
- [baseline]

**Desired** <!-- mirror the structure above so the delta is obvious; bold key state changes -->
- [after]

---

## User Stories

<!-- The heart of the PRD. One `### Story N` block per story. Each becomes a child issue in the tracker. -->

### Story 1 — [Title]

> _As a [role — a real role from the product context], I want [goal], so that [benefit]._

**Background:**

<!-- 2–4 sentences of prose (no bullets). The "why" and the mechanic — what an engineer must
understand before reading the ACs. If the mechanic depends on a capability, say whether it is
shipped or a proposed API expectation, per the repo's sources of truth. -->

**Fields:**

| Field | Type | Notes |
| --- | --- | --- |
| `field_name` | UUID / String / Integer / Decimal / Boolean / Enum / Timestamp | What it represents; allowed values if Enum |

**Events:** <!-- product-analytics events, snake_case, name what happened -->

| Event | Type | Description |
| --- | --- | --- |
| `event_name` | Entry / Success / Warning / Failure | What this event means |

<!-- At least one Entry (what triggers the story), one Success (happy path), a Warning (blocked/empty/
partial), and a Failure (system error). -->

**Acceptance Criteria:**

**AC-S1-001** — _[what this AC verifies]_

* **Path:** Success <!-- Success = happy path · Warning = valid but unusual/blocked · Failure = system error · Interaction = UI nav/state change -->
* **Given** [precondition / system state]
* **When** [action taken by user or system]
* **Then** [observable outcome]; `event_name` is emitted

<!-- Continue AC-S1-002, AC-S1-003 … Each story typically needs 4–8 ACs covering the happy path, key
edge/error cases, and permission/access. Numbering restarts per story: AC-S2-001, AC-S3-001, … Every
"Then" ends with the event it emits. -->

---

## Requirements / Flow

<!-- Numbered end-to-end flow. Use sub-lists for branches (e.g. connected vs not-connected, empty
state). Include any formula as a fenced code block. -->

1. [step]
2. [step]

---

## Config / rollout *(only if applicable)*

| Parameter / Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `param_name` | Boolean / Integer / … | [default] | [what it controls] |

<!-- Only include this section if the feature genuinely has flags, limits, or thresholds. Note if a
control is gated behind an integration or API key. -->

---

## Dependencies

<!-- Bullet list. For each: name it, say what it provides or must change, link the PRD/decision. -->
- **[System / integration]** — [a data store, auth provider, third-party API, payment processor,
  design tokens/components, or another PRD] — [what it provides / what must change].

---

## Risks & Considerations

| Risk | Mitigation |
| --- | --- |
| [risk] | [how it's mitigated or monitored] |

---

## Open Questions

| # | Question | Raised by | Status |
| --- | --- | --- | --- |
| 1 | [unresolved question — including any proposed/unconfirmed capability] | [name] | Open |

<!-- Anything not yet confirmed. Capability claims you couldn't verify against a declared source of
truth go here, not into the behaviour sections. Resolve these before the epic leaves Draft. -->

---

## Requirement → Story → Issue

| Requirement | Story | Issue | In scope | Notes |
| --- | --- | --- | --- | --- |
| [each requirement from Flow] | Story 1 | [issue id] | Yes | [note] |
| [out-of-scope item] | — | — | No | Out of scope |

<!-- Every requirement maps to a story and its child issue. Out-of-scope items get rows too.
Fill the issue ids after the epic + children are created at publish time, or leave `TBD`. -->

---

## Target Users

| User type | Description |
| --- | --- |
| [Role A] | [what changes for them with this PRD] |
| [Role B] | [what changes / "Unaffected — continues to …"] |
