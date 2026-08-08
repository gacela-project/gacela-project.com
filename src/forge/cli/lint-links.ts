import { readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

import { SHELL_ROUTES } from '../../templates/shell.ts'
import { auditLinks, findOrphans } from '../audit/index.ts'
import { flattenSidebar } from '../nav/index.ts'
import { build } from '../pipeline.ts'
import { loadSiteConfig, projectRoot, readVersion } from './context.ts'

const root = projectRoot()
const site = await loadSiteConfig(root)
const version = await readVersion(root)

const { pages } = await build({ site, root, version })

const publicDir = join(root, 'public')
const publicEntries = await readdir(publicDir, { recursive: true, withFileTypes: true })
const knownRoutes = publicEntries
  .filter((entry) => entry.isFile())
  .map((entry) => `/${relative(publicDir, join(entry.parentPath, entry.name)).split(sep).join('/')}`)

const problems = auditLinks(pages, { redirects: site.redirects, knownRoutes })

const orphans = findOrphans(
  pages,
  flattenSidebar(site.sidebar).map((item) => item.route),
  [...site.headerLinks.map((link) => link.route), ...SHELL_ROUTES],
)

if (orphans.length > 0) {
  console.warn(`Pages reachable only by direct URL: ${orphans.join(', ')}`)
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`  ${problem.source}: ${problem.message}`)
  console.error(`\n${problems.length} broken internal link(s).`)
  process.exitCode = 1
} else {
  const total = pages.reduce((count, page) => count + page.links.length, 0)
  console.log(`Checked ${total} internal links across ${pages.length} pages. All resolve.`)
}
