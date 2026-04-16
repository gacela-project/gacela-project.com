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
      message: 'PHP 8.1+ · v1.14.1',
      copyright: '© 2021-present, <a href="/team">Team</a> · <a href="/license">License</a> · <a href="https://packagist.org/packages/gacela-project/gacela">Packagist</a>',
    },
    outline: {
      level: [1, 3],
    },
    nav: [
      {
        text: 'Docs',
        items: [
          { text: 'Quickstart', link: '/docs/quickstart' },
          { text: 'Bootstrap', link: '/docs/bootstrap' },
          { text: 'Facade', link: '/docs/facade' },
          { text: 'Factory', link: '/docs/factory' },
          { text: 'Provider', link: '/docs/provider' },
          { text: 'Config', link: '/docs/config' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'Inject attribute', link: '/docs/inject' },
          { text: 'Cacheable methods', link: '/docs/cacheable-methods' },
          { text: 'CLI commands', link: '/docs/gacela-script' },
          { text: 'Health checks', link: '/docs/health-checks' },
          { text: 'Extensions & Plugins', link: '/docs/extensions' },
        ],
      },
      { text: 'About', link: '/about-gacela' },
      { text: 'Used in', link: '/used-in' },
      {
        text: 'v1.14.1',
        link: 'https://github.com/gacela-project/gacela/releases',
      },
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
        text: 'Core concepts',
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
        text: 'Configuration',
        items: [
          { text: 'Bindings', link: '/docs/bindings' },
          { text: 'Extensions & Plugins', link: '/docs/extensions' },
          { text: 'Module Customization', link: '/docs/customization' },
        ],
      },
      {
        text: 'Caching & performance',
        items: [
          { text: 'Caching', link: '/docs/caching' },
          { text: 'Cacheable methods', link: '/docs/cacheable-methods' },
          { text: 'Opcache preload', link: '/docs/opcache-preload' },
        ],
      },
      {
        text: 'Tooling',
        items: [
          { text: 'CLI commands', link: '/docs/gacela-script' },
          { text: 'Health checks', link: '/docs/health-checks' },
          { text: 'Static analysis', link: '/docs/static-analysis' },
        ],
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Other Frameworks', link: '/docs/other-frameworks' },
          { text: 'Testing', link: '/docs/testing' },
          { text: 'Advanced patterns', link: '/docs/extra' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gacela-project/gacela' },
      { icon: 'x', link: 'https://x.com/gacela_project' },
    ]
  }
})
