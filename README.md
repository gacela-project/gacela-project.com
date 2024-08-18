<p align="center">
    <a href="https://github.com/gacela-project/gacela/actions/workflows/tests.yml">
        <img src="https://github.com/gacela-project/gacela/actions/workflows/tests.yml/badge.svg" alt="Tests">
    </a>
    <a href="https://github.com/gacela-project/gacela/actions/workflows/code-style.yml">
        <img src="https://github.com/gacela-project/gacela/actions/workflows/code-style.yml/badge.svg" alt="Code Style">
    </a>
    <a href="https://github.com/gacela-project/gacela/actions/workflows/mutation-testing.yml">
        <img src="https://github.com/gacela-project/gacela/actions/workflows/mutation-testing.yml/badge.svg" alt="Mutation Testing">
    </a>
    <a href="https://github.com/gacela-project/gacela/blob/main/LICENSE">
        <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT Software License">
    </a>
</p>
<br>
<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/full-gacela-logo-dark.svg">
        <img alt="Gacela logo" src="public/full-gacela-logo.svg" width="350">
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

You can find the complete documentation for **gacela** online in the [official gacela documentation](https://gacela-project.com/).

## Contribute

You are welcome to contribute reporting issues, sharing ideas,
or with your pull requests.

Make sure to read our [contribution guide](.github/CONTRIBUTING.md) where you will find, among other things, how to set up your environment with the various tools we use to develop this framework.

## Contributors

<p align="center">
    <img src="https://contrib.nn.ci/api?repo=gacela-project/gacela" alt="Contributors list" />
</p>
