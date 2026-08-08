import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

import {
  bundleClientScripts,
  bundleCss,
  fingerprint,
  fingerprintedPath,
} from './assets/index.ts'
import { loadPages } from './content/index.ts'
import { createMarkdownRenderer } from './markdown/index.ts'
import { navStateFor } from './nav/index.ts'
import { renderPage, renderRedirect } from './render/index.ts'
import { buildSearchIndex, serializeSearchIndex } from './search/index.ts'
import type { Output, Page, RenderedPage, SiteConfig } from './types.ts'

export type BuildInput = {
  readonly site: SiteConfig
  readonly root: string
  readonly version: string
}

export type BuildResult = {
  readonly outputs: readonly Output[]
  readonly pages: readonly RenderedPage[]
}

/**
 * The whole build, in the order it happens.
 *
 * This module composes, it does not transform: every step below is a call into
 * a module that owns that step. If logic starts accumulating here, it belongs
 * somewhere else.
 */
export async function build(input: BuildInput): Promise<BuildResult> {
  const { site, root } = input

  const [pages, markdown, assets] = await Promise.all([
    loadPages(join(root, 'content')),
    createMarkdownRenderer(),
    buildAssets(root),
  ])

  const rendered = pages.map((page): RenderedPage => {
    const result = markdown.render(page.body, { source: page.source })

    return { ...page, ...result }
  })

  const documents = rendered.map((page): Output => {
    const nav = navStateFor(page.route, site.sidebar)

    return {
      path: outputPathFor(page.route),
      contents: renderPage({
        site,
        page,
        nav,
        assets: assets.references,
        version: input.version,
      }),
    }
  })

  const searchIndex = serializeSearchIndex(buildSearchIndex(rendered))

  return {
    pages: rendered,
    outputs: [
      ...documents,
      ...assets.outputs,
      ...redirectOutputs(site),
      ...(await publicOutputs(root)),
      { path: 'search-index.json', contents: searchIndex },
      { path: 'sitemap.xml', contents: sitemap(site, rendered) },
      { path: 'robots.txt', contents: robots(site) },
    ],
  }
}

/** `/docs/facade` becomes `docs/facade.html`, which every static host serves cleanly. */
function outputPathFor(route: string): string {
  return route === '/' ? 'index.html' : `${route.replace(/^\//, '')}.html`
}

type BuiltAssets = {
  readonly outputs: readonly Output[]
  readonly references: { readonly css: string; readonly js: string; readonly fonts: readonly string[] }
}

async function buildAssets(root: string): Promise<BuiltAssets> {
  const css = await bundleCss(join(root, 'src/design/index.css'))
  const cssPath = fingerprintedPath('assets/facet.css', fingerprint(css))

  const scriptDir = join(root, 'src/client')
  const scriptNames = (await readdir(scriptDir))
    .filter((name) => name.endsWith('.js'))
    .sort()

  const scripts = await Promise.all(
    scriptNames.map(async (name) => ({
      name,
      source: await readFile(join(scriptDir, name), 'utf8'),
    })),
  )

  const js = bundleClientScripts(scripts)
  const jsPath = fingerprintedPath('assets/app.js', fingerprint(js))

  return {
    outputs: [
      { path: cssPath, contents: css },
      { path: jsPath, contents: js },
    ],
    references: {
      css: `/${cssPath}`,
      js: `/${jsPath}`,
      fonts: [
        '/fonts/Raleway-Variable.woff2',
        '/fonts/Heebo-Variable.woff2',
        '/fonts/JetBrainsMono-Regular.woff2',
      ],
    },
  }
}

function redirectOutputs(site: SiteConfig): Output[] {
  return Object.entries(site.redirects).map(([from, to]) => ({
    path: outputPathFor(from),
    contents: renderRedirect(from, to, site),
  }))
}

/** Everything in public/ is copied to the site root untouched. */
async function publicOutputs(root: string): Promise<Output[]> {
  const publicDir = join(root, 'public')
  const entries = await readdir(publicDir, { recursive: true, withFileTypes: true })

  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name !== '.DS_Store')
      .map(async (entry) => {
        const absolute = join(entry.parentPath, entry.name)

        return {
          path: relative(publicDir, absolute).split(sep).join('/'),
          contents: new Uint8Array(await readFile(absolute)),
        }
      }),
  )
}

function sitemap(site: SiteConfig, pages: readonly RenderedPage[]): string {
  const urls = pages
    .filter((page) => page.frontmatter.unlisted !== true)
    .map((page) => `  <url><loc>${site.origin}${page.route === '/' ? '/' : page.route}</loc></url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

function robots(site: SiteConfig): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`
}

export type { Page }
