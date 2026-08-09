/**
 * The single source of truth for everything about the site that is an
 * editorial decision rather than a consequence of the content.
 *
 * Navigation is declared here rather than inferred from the filesystem: the
 * order the documentation is meant to be read in is a choice, and choices
 * belong somewhere a person can see them.
 */

import type { SiteConfig } from './src/forge/types.ts'

export const site: SiteConfig = {
  title: 'Gacela',
  tagline: 'Build modular PHP applications',
  description:
    'Gacela is a PHP framework for building applications out of modules that stay genuinely separate. Every module exposes the same four classes, and other modules only ever call the Facade.',
  origin: 'https://gacela-project.com',
  repository: 'https://github.com/gacela-project/gacela',
  siteRepository: 'https://github.com/gacela-project/gacela-project.com',
  packagist: 'https://packagist.org/packages/gacela-project/gacela',

  social: [
    { label: 'GitHub', href: 'https://github.com/gacela-project/gacela' },
    { label: 'X', href: 'https://x.com/gacela_project' },
  ],

  headerLinks: [
    { title: 'Get started', route: '/docs' },
    { title: 'About', route: '/about' },
    { title: 'Used in production', route: '/used-in' },
  ],

  sidebar: [
    {
      title: 'Getting started',
      items: [
        { title: 'Documentation', route: '/docs' },
        { title: 'Quickstart', route: '/docs/quickstart' },
        { title: 'Getting dependencies', route: '/docs/getting-dependencies' },
        { title: 'Bootstrap', route: '/docs/bootstrap' },
        { title: 'Upgrading', route: '/docs/upgrading' },
      ],
    },
    {
      title: 'Core concepts',
      items: [
        { title: 'Facade', route: '/docs/facade' },
        { title: 'Factory', route: '/docs/factory' },
        { title: 'Provider', route: '/docs/provider' },
        { title: 'Config', route: '/docs/config' },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { title: 'Bindings', route: '/docs/bindings' },
        { title: 'Service Map', route: '/docs/service-map' },
        { title: 'Inject attribute', route: '/docs/inject' },
        { title: 'Extensions & Plugins', route: '/docs/extensions' },
        { title: 'Module Customization', route: '/docs/customization' },
      ],
    },
    {
      title: 'Caching & performance',
      items: [
        { title: 'Caching', route: '/docs/caching' },
        { title: 'Cacheable methods', route: '/docs/cacheable-methods' },
        { title: 'Opcache preload', route: '/docs/opcache-preload' },
      ],
    },
    {
      title: 'Tooling',
      items: [
        { title: 'CLI commands', route: '/docs/gacela-script' },
        { title: 'Health checks', route: '/docs/health-checks' },
        { title: 'Events', route: '/docs/events' },
        { title: 'Static analysis', route: '/docs/static-analysis' },
      ],
    },
    {
      title: 'Integrations',
      items: [
        { title: 'Other frameworks', route: '/docs/other-frameworks' },
        { title: 'Testing', route: '/docs/testing' },
        { title: 'Advanced patterns', route: '/docs/extra' },
      ],
    },
  ],

  /* URLs the previous site published. They stay reachable. */
  redirects: {
    '/docs/index': '/docs',
    '/styleguide': '/design-system',
    '/about-gacela': '/about',
    '/why-decoupling': '/about#why-decoupling',
  },
}
