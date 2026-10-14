---
name: design-tokens
description: >-
  The workflow for adding or changing any design token: colours, radii, spacing, type,
  shadows, opacity. Trigger when the user wants to add a token, change a token value,
  says "the component needs a token that doesn't exist yet", updates the palette or
  scales, asks to regenerate tokens, reviews a token PR, or has changed Figma variables
  and needs them in code. Also trigger from `building-components` whenever a Figma
  binding points at a token that hasn't been generated. The design tool is the single
  source of truth; tokens reach code through a Git-synced export and a deterministic CI
  transform, never by hand. Never hand-edit generated CSS, hand-edit token values, or
  invent a value in code. An agent in the token VALUE path is the single most damaging
  way this goes wrong.
---

# Design tokens

Tokens are the foundation every component is painted with, so a silent error here poisons
everything downstream. That is why this pipeline is built **zero-trust**: not "the designer was
careful" or "the agent transcribed it right," but *every run re-derives the output and a gate
proves it.* Trust comes from determinism and verification, never from good intentions.

The one rule that makes that possible: **no agent (and no human) is ever in the token *value*
path.** Values are authored in the design tool and transformed mechanically. The moment a model
"reads the change and writes the JSON," you've traded determinism for a vibe. An agent's only
jobs here are to *explain* a diff and *review* it, never to produce a value.

## Configure for your repo

The skill expects these; the example stack is Token Studio (Figma plugin) + Style Dictionary.

- **Authored input**: the raw token export the sync tool writes (for example `tokens/raw.tokens.json`).
  This is the **only** authored file. `AGENTS.md` should name its path.
- **Transform**: a deterministic build script (Style Dictionary config or a `build` script in the
  tokens package). Read the script name from `package.json`.
- **Generated output**: the CSS variables (and any manifest) the transform emits. Usually
  committed, because it's the artifact the app loads.
- **CI workflow**: rebuilds, validates and explains on every token PR. If the repo has none, the
  skill still works: you run the rebuild and validation locally and post the explanation yourself,
  and you flag the missing CI as the first thing to fix.
- **Visual check surface**: a foundations/tokens showcase in the docs, plus one consuming component.
- **Naming rule**: names transfer 1:1 from design-tool paths (mechanical kebab-case only). If the
  repo keeps a remapping table instead, note it as a decision to revisit; it's a table someone
  owns forever.

## The pipeline

```
Variable edited in the design tool
      |  sync plugin pushes to a branch (no manual export, clone or paste)
      v
  PR opened against the base branch
      |
      v  CI: the trust layer
  1. rebuild: run the transform from the raw export (deterministic)
  2. regenerate-and-commit: CI commits the rebuilt output back to the PR branch,
     so the designer never runs Node; the pushed export is the only input
  3. validate: every semantic token exists in every mode (light AND dark);
     no orphan references; token counts sane; no hand-edits to generated output survive
  4. explain: post the token diff (name: old -> new, and how many components it touches)
      v
  A human reads the explained diff + green gates and merges (never auto-merged)
```

## Step 1 — The designer edits the variable (the happy path)

1. Edit the **variable** in the design tool. A token that responds to theme must exist in
   **every** mode. A semantic token defined only in light breaks in dark; double inversions in
   grayscale ramps have come from exactly this.
2. In the sync plugin, **push** to a branch. A PR appears.
3. Review the explained diff and the visual; merge.

No JSON export, no clone, no `npm`. The plugin push is the whole front end. If you can't edit the
design file, the change is the designer's to make: flag it, don't work around it.

## Step 2 — What an agent does on a token PR

You are the trust layer's reviewer and explainer, never its transcriber.

- **Rebuild, don't trust the pushed output.** Run the transform yourself; the rebuild is
  authoritative. If the committed output disagrees with a clean rebuild, something is wrong
  upstream. Surface it. Never "fix" generated output by hand.
- **Validate**: every mode present for every semantic token, no orphan references, counts move
  in the expected direction.
- **Explain** the change in plain language: which tokens changed, old to new, and the blast
  radius (how many components consume them). This is the high-value, model-appropriate work:
  turning "a token moved" into "here's exactly what this restyles."
- **Verify the visual** in the foundations showcase and in a consuming component, light **and**
  dark.

## Step 3 — When a component needs a token that doesn't exist

This is the hook from `building-components`. The answer is never "hardcode it for now." It is:
**add the variable in the design tool, push via the plugin, let CI rebuild**, then bind the
component to the real token. A hardcoded value is a lie that drifts from the design and breaks in
the other theme.

If the design itself is inconsistent or off-scale and can't be fixed today, use the repo's
documented lint-ignore with a reason and a tracked issue, pick an existing token by **resolved
value**, and flag the inconsistency to the designer. You still never invent a value.

## Step 4 — When the transform itself needs to change (a different task)

Most token work is values flowing through an unchanged transform. But if the design file
introduces a **new structure** the transform doesn't handle (a new collection, a new shadow
decomposition, a token type it doesn't map), the transform code needs updating. That's a reviewed
**code change**, separate from a token-value change, and it does not come through the plugin.

Transforms accumulate non-obvious cases worth preserving: colours merged across base, extended and
per-mode semantic sets; foundations kept in px rather than rem; shadows composed from decomposed
x/y/blur/spread/colour parts; opacity emitted as a percentage. Extend in that spirit, explain the
new structure in the PR, and log it in `docs/decisions/` (HYG-04).

## Hard rules

- **Never hand-edit generated output.** It's regenerated; your edit vanishes on the next build and
  disagrees with the design until then. CI's rebuild-and-commit makes hand-edits pointless *and*
  detectable.
- **Never hand-edit token values in the raw export.** It's a sync export. Fix the value in the
  design tool and push, or the next push silently reverts you.
- **Never invent a token in code** to satisfy a component. Add it in the design tool first.
- **Never rename a token in code to "fix" drift.** Drift is fixed at the source, then pushed.
  Names transfer 1:1.
- **An agent never writes a token value.** It explains and reviews.

## Definition of done

- [ ] The change originated in the design tool and arrived via a sync push, not a hand edit
- [ ] CI rebuilt the output deterministically; the rebuild is what's committed
- [ ] Validation passed: every mode present, no orphan refs, counts sane
- [ ] The PR has a plain-language explanation of the diff and its blast radius
- [ ] Verified in the foundations showcase and a consuming component, light **and** dark
- [ ] Merged by a human after review, never auto-merged

## How this goes wrong

- **An agent "helpfully" transcribes a value.** The output looks right, nobody can prove it, and
  determinism is gone. This is the failure the whole pipeline exists to prevent.
- **A semantic token defined in one mode only.** Fine in light, broken in dark, found late.
- **Hand-patching generated CSS to unblock a component.** It reverts on the next rebuild, or
  worse, survives because there is no rebuild gate.
- **Mapping by token name instead of resolved value.** The name says "hover"; the value is
  near-black.
