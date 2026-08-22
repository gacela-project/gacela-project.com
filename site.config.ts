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
        { title: 'Extensions and plugins', route: '/docs/extensions' },
        { title: 'DTO schema', route: '/docs/dto-schema' },
        { title: 'Module customization', route: '/docs/customization' },
      ],
    },
    {
      title: 'Caching & performance',
      items: [
        { title: 'Caching', route: '/docs/caching' },
        { title: 'Cacheable methods', route: '/docs/cacheable-methods' },
        { title: 'FileCache and ScopedCache', route: '/docs/file-cache' },
        { title: 'Opcache preload', route: '/docs/opcache-preload' },
      ],
    },
    {
      title: 'Tooling',
      items: [
        { title: 'CLI reference', route: '/docs/cli' },
        { title: 'Health checks', route: '/docs/health-checks' },
        { title: 'Profiling', route: '/docs/profiling' },
        { title: 'Events', route: '/docs/events' },
        { title: 'Static analysis', route: '/docs/static-analysis' },
        { title: 'Module boundaries', route: '/docs/module-boundaries' },
      ],
    },
    {
      title: 'Integrations',
      items: [
        { title: 'Framework integration', route: '/docs/framework-integration' },
        { title: 'Testing', route: '/docs/testing' },
        { title: 'Single-file modules', route: '/docs/single-file-modules' },
      ],
    },
  ],

  /* Frozen documentation lines. The 1.x snapshot is the docs as they stood at
     Gacela 1.21.0, taken from the last commit that documented it. The files
     under content/docs/1.x/ are an archive: they are never edited, and this
     sidebar preserves the reading order that site shipped with. */
  archives: [
    {
      version: '1.x',
      label: '1.21.0',
      sidebar: [
        {
          title: 'Getting started',
          items: [
            { title: 'Documentation', route: '/docs/1.x' },
            { title: 'Quickstart', route: '/docs/1.x/quickstart' },
            { title: 'Bootstrap', route: '/docs/1.x/bootstrap' },
          ],
        },
        {
          title: 'Core concepts',
          items: [
            { title: 'Facade', route: '/docs/1.x/facade' },
            { title: 'Factory', route: '/docs/1.x/factory' },
            { title: 'Provider', route: '/docs/1.x/provider' },
            { title: 'Config', route: '/docs/1.x/config' },
          ],
        },
        {
          title: 'Configuration',
          items: [
            { title: 'Bindings', route: '/docs/1.x/bindings' },
            { title: 'Service Map', route: '/docs/1.x/service-map' },
            { title: 'Inject attribute', route: '/docs/1.x/inject' },
            { title: 'Extensions & Plugins', route: '/docs/1.x/extensions' },
            { title: 'Module Customization', route: '/docs/1.x/customization' },
          ],
        },
        {
          title: 'Caching & performance',
          items: [
            { title: 'Caching', route: '/docs/1.x/caching' },
            { title: 'Cacheable methods', route: '/docs/1.x/cacheable-methods' },
            { title: 'Opcache preload', route: '/docs/1.x/opcache-preload' },
          ],
        },
        {
          title: 'Tooling',
          items: [
            { title: 'CLI commands', route: '/docs/1.x/cli' },
            { title: 'Health checks', route: '/docs/1.x/health-checks' },
            { title: 'Static analysis', route: '/docs/1.x/static-analysis' },
            { title: 'Events', route: '/docs/1.x/events' },
          ],
        },
        {
          title: 'Integrations',
          items: [
            { title: 'Other Frameworks', route: '/docs/1.x/framework-integration' },
            { title: 'Testing', route: '/docs/1.x/testing' },
            { title: 'Advanced patterns', route: '/docs/1.x/single-file-modules' },
          ],
        },
      ],
    },
  ],

  /* URLs the previous site published. They stay reachable. */
  redirects: {
    '/docs/index': '/docs',
    '/about-gacela': '/about',
    '/why-decoupling': '/about#why-decoupling',
  },
}
