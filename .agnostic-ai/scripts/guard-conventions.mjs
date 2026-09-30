#!/usr/bin/env node
/**
 * Convention guard.
 *
 * Runs after every file write, from Claude Code and from Codex, and reports the
 * repo rules that the written files just broke. It never blocks: it writes
 * findings back to the model as context so they get fixed in the same turn
 * rather than at review time.
 *
 * Rules, all documented in the generated agent instructions:
 *   - design CSS: no raw colour literals outside tokens.css
 *   - forge modules: no reaching past another module's index.ts
 *   - forge modules: no non-erasable TypeScript (Node strips types, it does not compile)
 *   - content/docs: prose is mirrored upstream and must not be reworded
 *   - prose: no em dashes
 */

import { readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// Sync copies this script to .claude/hooks/ and .codex/hooks/, two levels
// below the root. Codex sets no project directory variable, and its session
// may start in a subdirectory, so neither the environment nor cwd is reliable.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const stdin = readFileSync(0, 'utf8').trim()
if (!stdin) process.exit(0)

let payload
try {
  payload = JSON.parse(stdin)
} catch {
  process.exit(0)
}

const baseDir = typeof payload?.cwd === 'string' ? payload.cwd : projectDir

/**
 * Claude Code names the one file it wrote. Codex reports every edit as an
 * apply_patch whose file headers name the files it touched.
 */
function editedFiles(toolInput) {
  if (typeof toolInput?.file_path === 'string') return [toolInput.file_path]
  if (typeof toolInput?.command !== 'string') return []

  return [...toolInput.command.matchAll(/^\*\*\* (?:Add File|Update File|Move to): (.+)$/gm)].map(
    (match) => resolve(baseDir, match[1].trim()),
  )
}

function check(filePath) {
  const rel = relative(projectDir, resolve(filePath)).split(sep).join('/')
  if (rel.startsWith('..') || rel.startsWith('node_modules/') || rel.startsWith('dist/')) return null

  let source
  try {
    source = readFileSync(filePath, 'utf8')
  } catch {
    return null
  }

  const lines = source.split('\n')
  const findings = []
  const notices = []
  const report = (line, rule, detail) => findings.push({ line, rule, detail })

  const scan = (pattern, rule, detail, skip) => {
    lines.forEach((text, index) => {
      if (skip?.(text)) return
      if (pattern.test(text)) report(index + 1, rule, detail)
      pattern.lastIndex = 0
    })
  }

  // --- design system -------------------------------------------------------

  if (rel.startsWith('src/design/') && rel.endsWith('.css') && !rel.endsWith('tokens.css')) {
    scan(
      /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|lab)a?\(/,
      'design/tokens-only',
      'raw colour literal outside tokens.css; add a token in src/design/tokens.css and reference it with var()',
      (text) => text.trimStart().startsWith('*') || text.trimStart().startsWith('/*'),
    )
  }

  // --- forge module boundaries --------------------------------------------

  if (rel.startsWith('src/forge/') && rel.endsWith('.ts')) {
    const currentModule = rel.split('/')[2]

    lines.forEach((text, index) => {
      const match = /from\s+'(\.\.\/[a-z-]+\/[^']+)'/.exec(text)
      if (!match) return
      const target = match[1]
      const segments = target.split('/')
      const targetModule = segments[1]
      const isIndex = segments.length === 3 && segments[2] === 'index.ts'
      if (targetModule !== currentModule && !isIndex) {
        report(
          index + 1,
          'forge/module-boundary',
          `imports '${target}' directly; cross-module imports must go through '../${targetModule}/index.ts'`,
        )
      }
    })

    scan(
      /^\s*(?:export\s+)?(?:const\s+)?enum\s|^\s*namespace\s|^\s*(?:export\s+)?declare\s+(?!global)/,
      'forge/erasable-only',
      'non-erasable TypeScript; Node strips types rather than compiling, so enums, namespaces and parameter properties do not exist at runtime',
    )
  }

  // --- documentation fidelity ----------------------------------------------

  const isMirroredDoc = rel.startsWith('content/docs/')

  if (isMirroredDoc) {
    notices.push(
      'This file mirrors the upstream Gacela documentation. Presentation may change; the prose must not be reworded unless that was explicitly requested.',
    )
  }

  // --- prose ------------------------------------------------------------------

  if (!isMirroredDoc && /\.(md|html|ts|css)$/.test(rel)) {
    scan(/—/, 'prose/no-em-dash', 'em dash; use a comma, a colon or a full stop')
  }

  return { rel, findings, notices }
}

const results = editedFiles(payload?.tool_input)
  .map(check)
  .filter((result) => result !== null)

const findings = results.flatMap(({ rel, findings }) => findings.map((f) => ({ rel, ...f })))
const notices = [...new Set(results.flatMap(({ notices }) => notices))]

if (findings.length === 0) {
  if (notices.length > 0) console.log(notices.join('\n'))
  process.exit(0)
}

const summary = findings
  .slice(0, 20)
  .map((f) => (f.line ? `  ${f.rel}:${f.line}  [${f.rule}] ${f.detail}` : `  ${f.rel}  [${f.rule}] ${f.detail}`))
  .join('\n')

const instructions = process.env.AGNOSTIC_AI_TARGET === 'codex' ? 'AGENTS.md' : 'CLAUDE.md'

console.error(
  [
    `Convention guard flagged ${findings.length} item(s):`,
    summary,
    ...notices,
    '',
    `Fix these before moving on. See ${instructions}.`,
  ].join('\n'),
)
process.exit(2)
