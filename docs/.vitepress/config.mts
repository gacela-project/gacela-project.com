import { defineConfig, type HeadConfig } from 'vitepress'
import { readFileSync } from 'node:fs'
import { allPages, docsGroups, rawPathForRoute } from './docs-manifest.mjs'

const siteUrl = 'https://gacela-project.com'
const gacelaVersion: string = JSON.parse(
  readFileSync(new URL('./gacela-version.json', import.meta.url), 'utf-8'),
).version

const pagesBySource = new Map(allPages.map((page) => [page.source, page]))

export default defineConfig({
  title: 'Gacela',
  description: 'Build modular PHP applications with explicit, predictable boundaries.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  transformHead({ pageData }): HeadConfig[] {
    const page = pagesBySource.get(pageData.relativePath)
    if (!page) return []

    const canonical = `${siteUrl}${page.link}`
    const markdown = `${siteUrl}${rawPathForRoute(page.link)}`

    return [
      ['meta', { name: 'description', content: page.description }],
      ['meta', { property: 'og:description', content: page.description }],
      ['meta', { property: 'og:url', content: canonical }],
      ['link', { rel: 'canonical', href: canonical }],
      ['link', { rel: 'alternate', type: 'text/markdown', href: markdown }],
    ]
  },

  sitemap: { hostname: siteUrl },

  themeConfig: {
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/gacela-project/gacela-project.com/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    lastUpdated: { text: 'Updated' },
    footer: {
      message: `PHP 8.3+ · Gacela ${gacelaVersion}`,
      copyright: '© 2021-present, <a href="/team">Team</a> · <a href="/license">License</a> · <a href="https://packagist.org/packages/gacela-project/gacela">Packagist</a>',
    },
    outline: { level: [2, 3], label: 'On this page' },
    nav: [
      { text: 'Get started', link: '/docs/' },
      {
        text: 'Reference',
        items: docsGroups.slice(1).map((group) => ({
          text: group.text,
          items: group.items.map(({ text, link }) => ({ text, link })),
        })),
      },
      { text: 'About', link: '/about-gacela' },
      { text: 'Used in production', link: '/used-in' },
      {
        text: `v${gacelaVersion}`,
        link: `https://github.com/gacela-project/gacela/releases/tag/${gacelaVersion}`,
      },
    ],
    sidebar: docsGroups.map((group) => ({
      ...group,
      items: group.items.map(({ text, link }) => ({ text, link })),
    })),
    socialLinks: [
      { icon: 'github', link: 'https://github.com/gacela-project/gacela' },
      { icon: 'x', link: 'https://x.com/gacela_project' },
    ],
  },
})
