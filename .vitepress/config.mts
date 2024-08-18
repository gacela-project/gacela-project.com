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
    logo: {
      light: 'gacela-header-logo.svg',
      dark: 'gacela-header-logo-dark.svg',
    },
    siteTitle: false,
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
        items: [
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Bootstrap', link: '/bootstrap' },
          { text: 'Facade', link: '/facade' },
          { text: 'Factory', link: '/factory' },
          { text: 'Provider', link: '/provider' },
          { text: 'Config', link: '/config' },
          { text: 'Other Frameworks', link: '/other-frameworks' },
          { text: 'Gacela script', link: '/gacela-script' },
          { text: 'Extra', link: '/extra' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gacela-project/gacela' },
      { icon: 'x', link: 'https://x.com/gacela_project' },
    ]
  }
})
