import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { allPages, rawPathForRoute } from '../docs/.vitepress/docs-manifest.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = join(root, 'docs')
const publicRoot = join(docsRoot, 'public')
const failures = []

for (const page of allPages) {
  const sourcePath = join(docsRoot, page.source)
  const markdown = await readFile(sourcePath, 'utf8')
  const prose = markdown.replace(/```[\s\S]*?```/g, '')
  const headings = prose.match(/^# /gm) ?? []

  if (headings.length !== 1 && !['index.md', 'team.md'].includes(page.source)) {
    failures.push(`${page.source}: expected one H1, found ${headings.length}`)
  }
  if (!page.description.endsWith('.')) {
    failures.push(`${page.source}: manifest description must end with a period`)
  }

  try {
    await access(join(publicRoot, rawPathForRoute(page.link).slice(1)))
  } catch {
    failures.push(`${page.source}: generated Markdown mirror is missing`)
  }
}

for (const artifact of ['llms.txt', 'llms-full.txt']) {
  try {
    const contents = await readFile(join(publicRoot, artifact), 'utf8')
    if (!contents.includes('Gacela 2.0')) failures.push(`${artifact}: version heading is missing`)
  } catch {
    failures.push(`${artifact}: generated artifact is missing`)
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`Documentation checks passed for ${allPages.length} pages.`)
}
