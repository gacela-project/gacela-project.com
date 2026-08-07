import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { allPages, docsGroups, docsPages, rawPathForRoute, sitePages } from '../docs/.vitepress/docs-manifest.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = join(root, 'docs')
const publicRoot = join(docsRoot, 'public')
const siteUrl = 'https://gacela-project.com'

await removePreviousOutput()

const rendered = new Map()
for (const page of allPages) {
  const source = await readFile(join(docsRoot, page.source), 'utf8')
  const markdown = normalizeMarkdown(source)
  const outputPath = join(publicRoot, rawPathForRoute(page.link).slice(1))

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, markdown)
  rendered.set(page.source, markdown)
}

await writeFile(join(publicRoot, 'llms.txt'), buildIndex())
await writeFile(join(publicRoot, 'llms-full.txt'), buildFullContext(rendered))
await writeFile(join(publicRoot, '.agent-docs-manifest.json'), `${JSON.stringify(
  allPages.map((page) => rawPathForRoute(page.link).slice(1)),
  null,
  2,
)}\n`)

function normalizeMarkdown(source) {
  let markdown = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')

  for (const page of allPages) {
    const humanPath = page.link
    const rawUrl = `${siteUrl}${rawPathForRoute(humanPath)}`
    const escaped = humanPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    markdown = markdown.replace(new RegExp(`\\]\\(${escaped}(#[^)]+)?\\)`, 'g'), `](${rawUrl}$1)`)
  }

  return `${markdown.trim()}\n`
}

function buildIndex() {
  const lines = [
    '# Gacela 2.0 documentation',
    '',
    '> Gacela is a PHP 8.3+ library for building modular applications with explicit Facade, Factory, Provider, and Config boundaries.',
    '',
    'Use these Markdown documents as the source of truth for installing, configuring, and using Gacela 2.0.',
    '',
    'Recommended workflow: begin with the Quickstart, follow the caller through Facade and Factory, then consult Getting dependencies before adding Provider, Config, bindings, Inject, or Service Map.',
    '',
  ]

  for (const group of docsGroups) {
    lines.push(`## ${group.text}`, '')
    for (const page of uniquePages(group.items)) {
      lines.push(`- [${page.text}](${siteUrl}${rawPathForRoute(page.link)}): ${page.description}`)
    }
    lines.push('')
  }

  lines.push(
    '## Examples and project context',
    '',
    `- [Production case study](${siteUrl}/used-in.md): Verified Gacela patterns from the Phel language project.`,
    `- [About Gacela](${siteUrl}/about-gacela.md): The module model and architectural motivation.`,
    `- [Complete documentation](${siteUrl}/llms-full.txt): All documentation in one Markdown context file.`,
    '',
  )

  return lines.join('\n')
}

function buildFullContext(pages) {
  const lines = [
    '# Gacela 2.0 — complete documentation',
    '',
    `Canonical index: ${siteUrl}/llms.txt`,
    '',
  ]

  const contextPages = uniquePages([
    ...docsPages,
    ...sitePages.filter(({ source }) => ['about-gacela.md', 'used-in.md'].includes(source)),
  ])

  for (const page of contextPages) {
    lines.push(
      '---',
      '',
      `Source: ${siteUrl}${rawPathForRoute(page.link)}`,
      '',
      pages.get(page.source).trim(),
      '',
    )
  }

  return `${lines.join('\n').trim()}\n`
}

async function removePreviousOutput() {
  try {
    const previous = JSON.parse(await readFile(join(publicRoot, '.agent-docs-manifest.json'), 'utf8'))
    await Promise.all(previous.map((file) => rm(join(publicRoot, file), { force: true })))
  } catch {
    // First generation has no manifest to clean.
  }
}

function uniquePages(pages) {
  return [...new Map(pages.map((page) => [page.source, page])).values()]
}
