<p align="center">
    <a href="https://github.com/gacela-project/gacela/actions/workflows/tests.yml">
        <img src="https://github.com/gacela-project/gacela/actions/workflows/tests.yml/badge.svg" alt="Tests">
    </a>
    <a href="https://github.com/gacela-project/gacela/actions/workflows/code-style.yml">
        <img src="https://github.com/gacela-project/gacela/actions/workflows/code-style.yml/badge.svg" alt="Code Style">
    </a>
    <a href="https://app.netlify.com/sites/gacela-project/deploys">
        <img src="https://api.netlify.com/api/v1/badges/eed2291b-697f-4c55-9cd2-89d847a16a76/deploy-status" alt="Netlify Status">
    </a>
    <a href="https://github.com/gacela-project/gacela/blob/main/LICENSE">
        <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT Software License">
    </a>
</p>
<br>
<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="docs/public/full-gacela-logo-dark.svg">
        <img alt="Gacela logo" src="docs/public/full-gacela-logo.svg" width="350">
    </picture>
</p>

<h1 align="center">Build modular PHP applications</h1>

<p align="center">
    Simplify the communication of your different modules in your application.
</p>

## Description

Gacela encourages your modules to interact with each other in a unified way:

- Modules interact with each **other** only via their **Facade**
- The **Facade** is the _entry point_ of a module
- The **Factory** manages the _intra-dependencies_ of the module
- The **Provider** resolves the _extra-dependencies_ of the module
- The **Config** has access to the project's _config_ files

## Documentation

You can find the complete documentation for **Gacela 2.0** online in the [official Gacela documentation](https://gacela-project.com/). Gacela 2.0 requires PHP 8.3 or newer; applications upgrading from 1.21 should start with the [2.0 upgrade guide](https://gacela-project.com/docs/upgrading).

## Development

This site is built with [VitePress](https://vitepress.dev/).

```bash
npm ci             # install dependencies
npm run docs:dev   # local dev server with hot reload
npm run docs:build # production build into docs/.vitepress/dist
npm run docs:preview # preview the production build
```

The theme lives in `docs/.vitepress/theme/`:

- `style.css` — design tokens (default indigo accent, blue-ink dark mode) and home page sections
- `fonts.css` — self-hosted fonts: Raleway (display), Heebo (body), JetBrains Mono (code)
- `GacelaMark.vue` — the animated hero gazelle, drawn facet by facet on page load

## Contribute

You are welcome to contribute reporting issues, sharing ideas,
or with your pull requests.

Make sure to read our [contribution guide](https://github.com/gacela-project/gacela/blob/main/.github/CONTRIBUTING.md) where you will find, among other things, how to set up your environment with the various tools we use to develop this framework.

## Contributors

<p align="center">
    <img src="https://contrib.nn.ci/api?repo=gacela-project/gacela" alt="Contributors list" />
</p>
