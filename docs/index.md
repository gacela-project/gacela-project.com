---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Gacela"
  text: "build modular PHP applications"
  tagline: Simplify the communication of your different modules in your application
  image:
    light: /gacela-logo.svg
    dark: /gacela-logo-dark.svg
    alt: gacela logo
  actions:
    - theme: brand
      text: Quickstart
      link: /docs/quickstart
    - theme: alt
      text: About Gacela
      link: /about-gacela
    - theme: alt
      text: Why decoupling?
      link: /about-gacela#why-decoupling

features:
  - icon:
      src: /features-facade.svg
    title: Facade
    details: is the <i>entry point</i> of a module
    link: /docs/facade
  - icon:
      src: /features-factory.svg
    title: Factory
    details: manages the <i>intra-dependencies</i> of the module
    link: /docs/factory
  - icon:
      src: /features-provider.svg
    title: Provider
    details: resolves the <i>extra-dependencies</i> of the module
    link: /docs/provider
  - icon:
      src: /features-config.svg
    title: Config
    details: has access to the project's <i>config</i> files
    link: /docs/config
---

<section class="more-features">
  <h2 class="more-features-title">And more</h2>
  <div class="more-features-grid">
    <a class="more-features-item" href="/docs/bindings#factory-services">
      <strong>Container DI</strong>
      <span>Contextual bindings, aliases, protected & factory services</span>
    </a>
    <a class="more-features-item" href="/docs/caching">
      <strong>Caching</strong>
      <span>Three layers: framework resolution, cacheable methods, file cache</span>
    </a>
    <a class="more-features-item" href="/docs/gacela-script">
      <strong>Tooling</strong>
      <span>cache:warm, doctor, debug:dependencies, profile:report</span>
    </a>
    <a class="more-features-item" href="/docs/health-checks">
      <strong>Health checks</strong>
      <span>Per-module status for the doctor CLI and HTTP endpoints</span>
    </a>
    <a class="more-features-item" href="/docs/inject">
      <strong>Inject attribute</strong>
      <span>Opt-in #[Inject] constructor injection with implementation overrides</span>
    </a>
    <a class="more-features-item" href="/docs/provider#provides-attribute">
      <strong>Provides attribute</strong>
      <span>Declarative #[Provides] for provider service registration</span>
    </a>
  </div>
</section>

