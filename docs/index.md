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
      link: /why-decoupling

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

