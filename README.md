# Figma Skills

[![skills.sh](https://skills.sh/b/Kemdirimakujuobi/skills)](https://skills.sh/Kemdirimakujuobi/skills)

Two skills that make an agent build a Figma design **exactly**, instead of approximately.

Agents are bad at this in a specific, repeatable way: they screenshot the frame, eyeball it, and
write CSS that looks close. A 14px gap becomes 16. A semi-transparent border becomes solid. Dark
mode inherits values it was never supposed to inherit. Every one of those is invisible in a
side-by-side glance and obvious in production.

The fix isn't a better prompt. It's an order of operations, and a loop that doesn't exit early.

## Install

```bash
npx skills@latest add Kemdirimakujuobi/skills
```

## Why use it?

**The screenshot is the last thing you pull, not the first.**

Almost every failed Figma build starts the same way — the agent looks at a picture and starts
typing numbers. `figma-import` makes that impossible. It forces the full node pull before any
question is asked, then extraction in a fixed order: spacing first, then colour, then type and
radii and states. The screenshot comes last, and only as the thing you verify against. You build
from measured tokens; you never build from an image.

**"Close enough" is not a state a build can be in.**

`figma-build` sets the bar at 1:1 and gives the agent the only method that actually reaches it —
round-tripping. Build, render, screenshot, diff the computed values numerically against Figma, fix
every discrepancy including the 1px ones, repeat. It exits when the measured delta is zero across
every state and both themes, not when the result looks about right.

Together they replace "make it match the Figma" — a request agents reliably fumble — with a
procedure that has a definition of done.

## Reference

- **[figma-import](./skills/figma-import/SKILL.md)** — Enforces the extraction order: full node
  first with no clarifying questions, locate the target piece, then every spacing token, then
  colour, then type, radii, shadows and every interactive state. Screenshot last. Produces a
  token-binding table for `figma-build` to implement against.
- **[figma-build](./skills/figma-build/SKILL.md)** — The 1:1 round-trip loop. Build from the
  extracted tokens, render at the Figma frame's viewport and theme, measure rather than eyeball,
  list every discrepancy, fix, repeat until zero. Ships with
  [MEASURE.md](./skills/figma-build/MEASURE.md) — the exact snippets for reading computed spacing,
  colour, type and shadow, driving hover and focus states, and checking both themes numerically.

They're designed as a pair: `figma-import` captures, `figma-build` implements. Both defer to a
repo's own design-token and component workflows where those exist — they govern order and
fidelity, never the values themselves.

## License

MIT
