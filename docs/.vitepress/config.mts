import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  ignoreDeadLinks: true,
  title: "Gacela",
  description: "Gacela helps you build modular PHP applications simplifying the communication of the different modules in your application",
  lang: 'en-US',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }]
  ],

  sitemap: {
    hostname: 'https://gacela-project.com'
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    footer: {
      message: '© 2021-present, <a href="/team">Team</a> and <a href="/license">License</a>',
    },
    outline: {
      level: [1, 3],
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'About Gacela', link: '/about-gacela' },
      { text: 'Why decoupling?', link: '/why-decoupling' },
      { text: 'Used in', link: '/used-in' },
    ],

    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'Quickstart', link: '/docs/quickstart' },
          { text: 'Bootstrap', link: '/docs/bootstrap' },
        ],
      },
      {
        text: 'Module pillars',
        items: [
          { text: 'Facade', link: '/docs/facade' },
          { text: 'Factory', link: '/docs/factory' },
          { text: 'Provider', link: '/docs/provider' },
          { text: 'Config', link: '/docs/config' },
          { text: 'Service Map', link: '/docs/service-map' },
          { text: 'Inject attribute', link: '/docs/inject' },
        ],
      },
      {
        text: 'Production & tooling',
        items: [
          { text: 'Gacela script', link: '/docs/gacela-script' },
          { text: 'Caching', link: '/docs/caching' },
          { text: 'Cacheable methods', link: '/docs/cacheable-methods' },
          { text: 'Opcache preload', link: '/docs/opcache-preload' },
          { text: 'Health checks', link: '/docs/health-checks' },
          { text: 'Static analysis', link: '/docs/static-analysis' },
        ],
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Other Frameworks', link: '/docs/other-frameworks' },
          { text: 'Testing', link: '/docs/testing' },
          { text: 'Extra', link: '/docs/extra' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gacela-project/gacela' },
      { icon: 'x', link: 'https://x.com/gacela_project' },
    ]
  }
})
