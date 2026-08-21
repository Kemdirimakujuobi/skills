---
name: figma-import
description: Pull a Figma node in the order that decides whether the build can be correct — the full node first with no clarifying questions, then locate the exact piece, then every spacing token, then colour, then type/radii/shadows/states, and the screenshot LAST. Use the moment a figma.com link is shared or someone says "implement this Figma", "here's the figma", "build this from Figma". The screenshot is what you verify against, never what you build from. Hands the extraction record to figma-build.
---

# Importing from Figma

Figma is the source of truth. A build is only as correct as the data you pulled — so this
skill front-loads **all** the extraction, in a fixed order, and defers the screenshot to the
very end. The point: you reproduce the *decisions the designer made* — exact spacing, gaps,
colours, radii, type — read from the file, never guessed from a picture.

**Do not ask the user which part, which frame, or whether to narrow. Pull first, then locate.**
Questions before a full pull waste a round and usually get answered by the pull itself.

## The order is non-negotiable

Run these steps in sequence. Do not skip ahead to the screenshot; do not build until step 6
is done.

### 1. Pull the FULL node first — no questions

- Extract `fileKey` + `nodeId` from the URL. For `figma.com/design/:fileKey/:name?node-id=1-2`
  → `fileKey = :fileKey`, `nodeId = 1:2`. For a `/branch/:branchKey/` URL, the branchKey is the fileKey.
- If your environment ships a Figma design-to-code prerequisite skill, it is **mandatory before
  `get_design_context`** — load it first.
- Pull structure and reference together, on the **whole** node you were given:
  `get_metadata` (the layer tree — ids, names, types, sizes, positions) and
  `get_design_context` (reference code + variable hints). Pull the full node even if it looks
  large. A partial pull is the single most common cause of a wrong build.

### 2. Locate the correct section

- From the metadata tree, identify the exact node(s) to build — by name and structure, e.g. the
  `Side navigation` frame, the `Section` component, the specific variant. Narrow to those node
  ids **yourself**; don't ask the user to point again.
- If the node has variants or states (Default / Hover / Collapsed / Disabled), enumerate **all**
  of them now. Each one is a state you will owe later.

### 3. Collect ALL spacing and gap tokens — first

- `get_variable_defs` on the target node. Record **every** spacing value: gaps between items and
  between sections, padding, item heights, insets. Map each to its token on the design's spacing
  scale and to the resolved px.
- Build a spacing map: for each container, its gap; for each element, its padding. A "one pixel
  off" failure is measured against this map — capture it before anything else.

### 4. Then colour tokens

- From the same variable defs, collect every colour: fills, strokes, borders, backgrounds, text,
  icons — each as its **token**, per state.
- Map by what the token **resolves to**, not by what the layer is called. A layer named
  `surface-subtle` may well be bound to a different semantic token.

### 5. Then everything else

- Typography: family, weight/style, size, line-height, letter-spacing — as tokens.
- Radii, shadows and elevation, border widths, opacity.
- Icons and assets: note every exported asset. Never hand-draw an icon or invent SVG paths.
- **Every interactive state**: rest, hover, focus-visible, active, disabled, selected — and how
  each token flips between them, and between light and dark if the file has both.

### 6. Only now — screenshot

- `get_screenshot` of the full node, and per state where it matters. This is the **visual truth
  to check the build against**, not a substitute for the data above.
- If the screenshot and your captured tokens disagree, re-read the file. Don't trust your eyes
  over the variables.

## Output: the extraction record

Produce a compact **token-binding table** — every styled property → its token and resolved value
→ the state it applies in — plus the spacing map and the list of states and assets. That record
is the contract `figma-build` implements against and the reviewer diffs against Figma.

## Deferring to the repo

If the current repo ships its own design-system skills or docs, they stay authoritative and this
skill feeds them:

- **Token values live in the repo's pipeline, never in your head.** If a Figma binding points at
  a token the repo hasn't generated, that's a pipeline gap — stop and route it through the repo's
  token workflow. **Never invent the value in code.**
- **Structure and props follow the repo's component workflow.** This skill owns the *extraction*;
  that workflow owns the *build shape*.

## Definition of done

- [ ] Full node pulled before any question was asked
- [ ] Target piece and all its states located from the metadata tree
- [ ] Spacing captured **first**, then colour, then type / radii / shadow / border / icons / states
- [ ] Screenshot taken **last**, and reconciled against the captured tokens
- [ ] A token-binding table and spacing map handed to `figma-build`

## How this goes wrong

- **Screenshot first → eyeballed build.** You read 14px as "about 16", miss a token flip in dark
  mode, and fail the 1:1 bar. The order exists to stop exactly this.
- **Partial pull.** You grab the visible frame and miss the container that owns the gap.
- **Asking before pulling.** The pull answers most "which part?" questions for free, and costs a
  round trip if you ask first.
- **Trusting the layer name over the resolved value.** Map by what the token resolves to.
