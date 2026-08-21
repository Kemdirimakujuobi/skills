---
name: figma-build
description: Implement a Figma design to a measured 1:1 match by round-tripping — build from the extracted tokens, render it, screenshot it, diff it against Figma numerically, fix every discrepancy, repeat until the delta is zero across every state and both themes. Use when building, implementing, porting, or restyling any UI from Figma. One pixel off is a failed build. Requires figma-import to have captured the design first; never build from a screenshot alone.
---

# Building 1:1 from Figma

**Figma is the source. The bar is 1:1. One pixel off is a failed build.** The only way to hit
that bar reliably is to round-trip. You do not get there by building once and hoping — you get
there by measuring your implementation against the file, over and over, until nothing differs.

## Before you write any code

- **`figma-import` must have run.** You build from its token-binding table and spacing map — not
  from an image, and not from a partial pull. If the context isn't fully captured, go back and
  capture it. A lazy pull guarantees a failed 1:1.
- **Build from tokens, verify against the screenshot.** The numbers you type come from the
  extracted variables. The screenshot only ever confirms them.

## The round-trip loop

This is the skill. Repeat until the measured diff is zero.

1. **Build or adjust** from the extracted tokens — semantic tokens only, no hardcoded guesses,
   every state wired.
2. **Render it** in a real surface (Storybook, the dev server, a preview route) at the **same
   viewport, zoom, and theme** as the Figma frame. Same viewport is not optional — a layout
   measured at the wrong width is measuring the wrong thing.
3. **Measure. Don't eyeball.** For every element, compare the rendered value against Figma:
   spacing and padding, width and height, colour, radius, shadow, border width, and every type
   property. See [MEASURE.md](./MEASURE.md) for how to read each one.
4. **List every discrepancy, including 1px.** "The header gap is 14px, Figma says 16px" is a
   defect, not a rounding tolerance.
5. **Fix, and loop back to step 1.** As many passes as it takes. Stop when the diff is **zero** —
   not when it looks about right.

Overlaying your screenshot on the Figma render at 1:1 opacity makes sub-pixel drift obvious, and
is the fastest way to catch a whole-block offset that per-element measuring can miss.

## Cover everything, not just the resting frame

- **Every state**: rest, hover, focus-visible, active, disabled, selected — each round-tripped.
- **Both themes**: light and dark. Token flips — a colour that inverts in dark — are exactly where
  1:1 breaks silently. Verify dark numerically; never assume it inherits.
- **Every variant frame**: if Figma has Collapsed / Expanded / Wide, each is its own 1:1 target.

## Done means zero diff

You may only claim the build is done when:

- [ ] Every spacing, size, colour, radius, shadow, border, and type value matches Figma when
      **measured** — across every state
- [ ] Light **and** dark verified with computed values, not just a light-mode look
- [ ] Each Figma variant round-tripped to zero diff
- [ ] The final screenshots sit next to the Figma render with no visible or measured delta

If you cannot get a value to match, that is a finding to surface — a token gap, or an
inconsistency in the Figma file. It is not a reason to ship "close".

## Deferring to the repo

In a repo with its own component workflow, that workflow owns the *shape* and this skill owns the
*fidelity*:

- **Follow the repo's component workflow** for structure, prop API, accessibility, and whatever
  documentation or evidence it requires.
- **Token values come from the repo's pipeline.** If Figma binds a token the repo hasn't
  generated, stop and route it through the token workflow. Never hardcode the value to force a
  1:1 match — a hex that matches today is a lie that drifts tomorrow.

## How this goes wrong

- **Building from the screenshot.** You approximate, and you fail 1:1. Build from the tokens.
- **One round-trip and done.** The first pass is never pixel-perfect. The discipline is looping.
- **Eyeballing the diff.** "Looks right" hides a 2px gap and a dark-mode colour flip.
- **Skipping dark, or skipping a state.** The delta you didn't check is the one that ships wrong.
- **Hardcoding to force a match.** Fix the token, don't fake the pixel.
