/**
 * Documentation information architecture.
 *
 * This is the source of truth for the sidebar, page metadata, navigation,
 * Markdown mirrors, and agent indexes.
 */
export const docsGroups = [
  {
    text: 'Getting started',
    collapsed: false,
    items: [
      page('Documentation', '/docs/', 'docs/index.md', 'Choose the shortest path from installation to a production-ready Gacela module.'),
      page('Quickstart', '/docs/quickstart', 'docs/quickstart.md', 'Install Gacela 2.0 and build a working module in a few minutes.'),
      page('Getting dependencies', '/docs/getting-dependencies', 'docs/getting-dependencies.md', 'Choose the right dependency mechanism for module-internal, cross-module, and external services.'),
      page('Bootstrap', '/docs/bootstrap', 'docs/bootstrap.md', 'Bootstrap Gacela, configure environments, application paths, caching, and container behavior.'),
      page('Upgrade from 1.21', '/docs/upgrading', 'docs/upgrading.md', 'Migrate an application from Gacela 1.21 to 2.0 safely.'),
    ],
  },
  {
    text: 'Build a module',
    collapsed: false,
    items: [
      page('Facade', '/docs/facade', 'docs/facade.md', 'Expose a small, stable public API for a Gacela module.'),
      page('Factory', '/docs/factory', 'docs/factory.md', 'Create a module’s internal services and wire their dependencies.'),
      page('Provider', '/docs/provider', 'docs/provider.md', 'Declare services a module needs from other modules or infrastructure.'),
      page('Config', '/docs/config', 'docs/config.md', 'Read typed application configuration inside a module.'),
    ],
  },
  {
    text: 'Dependency injection',
    collapsed: true,
    items: [
      page('Choose a mechanism', '/docs/getting-dependencies', 'docs/getting-dependencies.md', 'Compare factories, providers, bindings, Inject, and Service Map.'),
      page('Bindings & container', '/docs/bindings', 'docs/bindings.md', 'Configure bindings, lifetimes, aliases, tags, hooks, and definitions.'),
      page('Inject attribute', '/docs/inject', 'docs/inject.md', 'Inject services into constructors, properties, or setters with attributes.'),
      page('Service Map', '/docs/service-map', 'docs/service-map.md', 'Resolve Gacela services from classes created outside its container.'),
      page('Extensions & plugins', '/docs/extensions', 'docs/extensions.md', 'Extend framework configuration and hook into application bootstrap.'),
      page('Module customization', '/docs/customization', 'docs/customization.md', 'Customize pillar suffixes, namespaces, and module discovery.'),
    ],
  },
  {
    text: 'Operations',
    collapsed: true,
    items: [
      page('Caching', '/docs/caching', 'docs/caching.md', 'Understand Gacela’s framework, method-result, and file-cache layers.'),
      page('Cacheable methods', '/docs/cacheable-methods', 'docs/cacheable-methods.md', 'Cache facade method results with explicit keys and invalidation.'),
      page('Opcache preload', '/docs/opcache-preload', 'docs/opcache-preload.md', 'Generate and deploy an Opcache preload script for Gacela modules.'),
      page('CLI reference', '/docs/gacela-script', 'docs/gacela-script.md', 'Inspect, diagnose, warm, and visualize a Gacela application from the CLI.'),
      page('Health checks', '/docs/health-checks', 'docs/health-checks.md', 'Expose module health through the doctor command or an application endpoint.'),
      page('Events', '/docs/events', 'docs/events.md', 'Observe bootstrap, configuration, container, cache, and module lifecycle events.'),
    ],
  },
  {
    text: 'Quality & integration',
    collapsed: true,
    items: [
      page('Testing', '/docs/testing', 'docs/testing.md', 'Test Gacela applications with isolated container state and event assertions.'),
      page('Static analysis', '/docs/static-analysis', 'docs/static-analysis.md', 'Configure PHPStan and Psalm for typed accessors and module boundaries.'),
      page('Framework integration', '/docs/other-frameworks', 'docs/other-frameworks.md', 'Integrate Gacela with applications using another framework or container.'),
      page('Single-file modules', '/docs/extra', 'docs/extra.md', 'Use advanced single-file module patterns when a small boundary is enough.'),
    ],
  },
]

export const sitePages = [
  page('Gacela', '/', 'index.md', 'Build modular PHP applications with explicit, predictable boundaries.'),
  page('About Gacela', '/about-gacela', 'about-gacela.md', 'Understand the problem Gacela solves, how its module boundaries work, and when the approach fits.'),
  page('Used in production', '/used-in', 'used-in.md', 'Explore real Gacela architecture and code from the Phel language project.'),
  page('Team', '/team', 'team.md', 'Meet the maintainers of Gacela.'),
  page('License', '/license', 'license.md', 'Read the MIT license for Gacela and its documentation.'),
]

export const docsPages = uniquePages(docsGroups.flatMap((group) => group.items))
export const allPages = uniquePages([...sitePages, ...docsPages])

export function rawPathForRoute(route) {
  if (route === '/') return '/index.md'
  if (route.endsWith('/')) return `${route}index.md`
  return `${route}.md`
}

function page(text, link, source, description) {
  return { text, link, source, description }
}

function uniquePages(pages) {
  return [...new Map(pages.map((item) => [item.source, item])).values()]
}
