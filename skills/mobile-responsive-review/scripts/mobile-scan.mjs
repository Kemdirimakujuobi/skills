#!/usr/bin/env node
// Mobile-responsive scan for the `mobile-responsive-review` skill. Tailwind-oriented.
//
// Reads the ADDED lines of the branch vs <base> (committed, uncommitted and untracked) for UI files and reports:
//   1. risk hits — patterns that commonly break at phone width (a prompt to read, not a verdict);
//   2. desktop-changing hunks — hunks where dropping every max-md:/max-sm:/sm:max-md: token does not
//      reproduce the removed lines, i.e. edits that may change layout at >= 768px.
//
// Usage:
//   node mobile-scan.mjs [--base <ref>] [--dirs app,components,src] [--skip <regex>]...
//
//   --base   base ref to diff against.     Env: MOBILE_SCAN_BASE.  Default: origin/main
//   --dirs   comma-separated UI roots.     Env: MOBILE_SCAN_DIRS.  Default: app,components,src
//   --skip   regex for paths to ignore (repeatable; dev/preview/test surfaces).
//            Env: MOBILE_SCAN_SKIP (comma-separated regexes). Always skipped: tests, stories.
//
// Run it from the repo root. Exit code is always 0 — the skill decides what's a blocker.

import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const args = process.argv.slice(2)
if (args.includes("--help") || args.includes("-h")) {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 18).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"))
  process.exit(0)
}
const argValues = (name) => args.flatMap((a, i) => (a === name && args[i + 1] ? [args[i + 1]] : []))
const splitList = (s) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [])

const base = argValues("--base")[0] || process.env.MOBILE_SCAN_BASE || "origin/main"
const dirs = splitList(argValues("--dirs")[0] || process.env.MOBILE_SCAN_DIRS || "app,components,src").map((d) => d.replace(/\/+$/, ""))
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const UI_FILE = new RegExp(`^(${dirs.map(escapeRe).join("|")})\\/.*\\.(tsx|jsx|css)$`)
const SKIP = [
  /\.(test|spec|stories)\.(tsx|jsx)$/,
  /(^|\/)__tests__\//,
  ...[...argValues("--skip"), ...splitList(process.env.MOBILE_SCAN_SKIP)].map((s) => new RegExp(s)),
]

const mergeBase = git(["merge-base", base, "HEAD"]).trim()
// Tracked changes (committed + uncommitted) vs the merge-base, plus brand-new untracked files, which
// `git diff` never shows — rendered as all-added so a new page is scanned before its first commit.
const untracked = git(["ls-files", "--others", "--exclude-standard", "--", ...dirs])
  .split("\n")
  .filter((f) => f && UI_FILE.test(f))
const diff = [
  git(["diff", "-U0", "--no-color", mergeBase, "--", ...dirs]),
  ...untracked.map((f) => {
    const lines = readFileSync(f, "utf8").split("\n")
    return [`diff --git a/${f} b/${f}`, `@@ -0,0 +1,${lines.length} @@`, ...lines.map((l) => `+${l}`)].join("\n")
  }),
].join("\n")

// A token that only applies below md (or below sm, or sm..md) — never at >= 768px.
const PHONE_ONLY = /^!?(max-md|max-sm|sm:max-md):/

const RISKS = [
  {
    id: "fixed-width",
    test: (l) => fixedPx(l, /(?<![\w-])(?:w|min-w)-\[(\d+)px\]/g, 340),
    why: "fixed width wider than a phone — add max-md:w-full / max-md:min-w-0",
  },
  {
    id: "inline-width",
    test: (l) => {
      // `(?<![\w-])` keeps CSS `max-width:` / `min-width:` (media queries, caps) out of it.
      const m = l.match(/(?<![\w-])(?:width|minWidth)\s*:\s*['"]?(\d{3,})(?:px)?['"]?/)
      return m !== null && Number(m[1]) > 340
    },
    why: "inline width wider than a phone — use `min(Npx, calc(100vw - 2rem))` or a className override",
  },
  {
    id: "grid-cols",
    // A phone variant, a phone-hidden row, or a row given a min width to scroll sideways all count as handled.
    test: (l) =>
      /(?<![\w:-])grid-cols-(?:[3-9]|1[0-2]|\[)/.test(l) &&
      !/max-(?:md|sm):(?:grid-cols|hidden|min-w|flex|block)|(?<![\w-])(sm|md):grid-cols/.test(l),
    why: "multi-column grid with no phone variant — add max-md:grid-cols-1 (mind sm: ordering)",
  },
  {
    id: "sm-vs-max-md",
    test: (l) => /(?<![\w-])sm:grid-cols-\d/.test(l) && /max-md:grid-cols-\d(?!!)/.test(l),
    why: "sm:grid-cols beats max-md:grid-cols at 640–767px in Tailwind v4 — use max-md:grid-cols-N!",
  },
  {
    id: "h-screen",
    test: (l) => {
      if (/max-(?:md|sm):(h-auto|max-h|min-h|h-)/.test(l)) return false
      if (/(?<![\w:-])h-screen\b/.test(l)) return true
      const m = l.match(/(?<![\w:-])h-\[(\d+)px\]/)
      return m !== null && Number(m[1]) >= 300
    },
    why: "fixed/screen height can trap content (mobile browser chrome, a mobile top bar) — consider max-md:h-auto or h-dvh",
  },
  {
    id: "hover-only",
    test: (l) => /(?<![\w:-])opacity-0\b/.test(l) && /group-hover(?:\/[\w-]+)?:opacity-100/.test(l) && !/max-md:opacity-100/.test(l),
    why: "hover-only reveal — touch has no hover; add max-md:opacity-100 (and an aria-label if icon-only)",
  },
  {
    id: "dialog-max-w",
    test: (l) => /<DialogContent[^>]*className=["'{`][^"'`]*(?<![\w:-])max-w-(?:xl|[2-7]xl|\[)/.test(l) && !/max-(?:md|sm):max-w-/.test(l),
    why: "max-w-* on DialogContent can replace its viewport cap — add max-md:max-w-[calc(100%-2rem)]",
  },
  {
    id: "big-padding",
    test: (l) => /(?<![\w:-])(p|px)-(8|9|10|1[1-6])\b/.test(l) && !/max-(?:md|sm):(p|px)-/.test(l),
    why: "large padding eats a phone's width — add max-md:p-4 / max-md:px-4",
  },
  {
    id: "raw-table",
    test: (l) => /<table\b/.test(l),
    why: "hand-rolled <table> — make sure a parent has overflow-x-auto",
  },
  {
    id: "small-input-text",
    test: (l) => /<(input|textarea|Textarea|Input)\b/.test(l) && /(?<![\w:-])text-(xs|sm|\[1[0-5]px\])/.test(l) && !/max-md:text-\[16px\]/.test(l),
    why: "input text under 16px — iOS Safari zooms on focus; add max-md:text-[16px] (with ! over unlayered type classes)",
  },
  {
    id: "unlayered-type-override",
    // Custom type utilities (text-title-*, text-body-*, ...) are often defined outside @layer, so they
    // beat any layered utility. Adjust the prefix list to match your design system's type classes.
    test: (l) =>
      /\btext-(title|body|caption|label|heading|display)-[\w-]+/.test(l) &&
      [...l.matchAll(/max-(?:md|sm):text-(?:xs|sm|base|lg|[2-9]?xl|\[[^\]]+\])(!?)/g)].some((m) => m[1] !== "!"),
    why: "custom type classes are often unlayered — a max-md:text-* override needs a trailing ! to apply",
  },
  {
    id: "breakpoint-parity",
    test: (l) => /\binnerWidth\b|useIsMobile\(/.test(l),
    why: "JS breakpoint in px — if CSS gates the same UI, use matchMedia('(max-width: 47.999rem)') so they agree",
  },
]

function fixedPx(line, re, limit) {
  if (/max-(?:md|sm):(w-full|min-w-0|w-auto|max-w-|w-\[calc)|(?<![\w:-])max-w-(full|\[calc)/.test(line)) return false
  for (const m of line.matchAll(re)) {
    // Skip tokens that are themselves phone-only or desktop-scoped (md:w-[600px] is fine).
    const start = line.lastIndexOf(" ", m.index) + 1
    const token = line.slice(start, m.index + m[0].length).replace(/^["'`{(]+/, "")
    if (PHONE_ONLY.test(token) || /^(md|lg|xl|2xl):/.test(token)) continue
    if (Number(m[1]) > limit) return true
  }
  return false
}

const risks = []
const desktopHunks = []
let file = null
let hunk = null
let rem = []
let add = []

function flushHunk() {
  if (file && (rem.length || add.length) && !skipped(file)) {
    const strip = (lines) =>
      lines
        .filter((l) => !/^\s*(\/\/|\/\*|\*|\{\/\*)/.test(l))
        .join(" ")
        .split(/(\s+|["'`{}(),])/)
        .filter((t) => !PHONE_ONLY.test(t))
        .join("")
        .replace(/\s+/g, "")
        .replace(/(""|''|``),?/g, "")
    if (rem.length && strip(rem) !== strip(add)) desktopHunks.push({ file, line: hunk, removed: rem.length, added: add.length })
  }
  rem = []
  add = []
}

function skipped(f) {
  return !UI_FILE.test(f) || SKIP.some((re) => re.test(f))
}

let lineNo = 0
for (const raw of diff.split("\n")) {
  if (raw.startsWith("diff --git")) {
    flushHunk()
    file = raw.split(" b/").pop()
  } else if (raw.startsWith("@@")) {
    flushHunk()
    const m = raw.match(/\+(\d+)/)
    lineNo = m ? Number(m[1]) : 0
    hunk = lineNo
  } else if (raw.startsWith("-") && !raw.startsWith("---")) {
    rem.push(raw.slice(1))
  } else if (raw.startsWith("+") && !raw.startsWith("+++")) {
    const line = raw.slice(1)
    add.push(line)
    // Comments describe code; they aren't markup.
    if (file && !skipped(file) && !/^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line)) {
      for (const r of RISKS) if (r.test(line)) risks.push({ file, line: lineNo, id: r.id, why: r.why, src: line.trim() })
    }
    lineNo++
  }
}
flushHunk()

console.log(`mobile-scan — base ${base} (merge-base ${mergeBase.slice(0, 8)}), UI files under ${dirs.join(", ")}\n`)
if (risks.length === 0) console.log("Risk hits: none")
else {
  console.log(`Risk hits: ${risks.length} (read each; a hit is a prompt, not a verdict)`)
  for (const r of risks) console.log(`  ${r.file}:${r.line}  [${r.id}] ${r.why}\n      ${r.src.slice(0, 160)}`)
}
console.log("")
if (desktopHunks.length === 0) console.log("Desktop-changing hunks: none — every edit to existing lines is phone-only")
else {
  console.log(`Desktop-changing hunks: ${desktopHunks.length} (edits to existing lines that are not pure max-md:/max-sm: additions — show each is identical at >= 768px)`)
  for (const h of desktopHunks) console.log(`  ${h.file}:${h.line}  (-${h.removed} +${h.added})`)
}

function git(argv) {
  try {
    return execFileSync("git", argv, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
  } catch {
    console.error(`mobile-scan: git ${argv.join(" ")} failed — is "${base}" fetched? (git fetch origin), or pass --base <ref>`)
    process.exit(0)
  }
}
