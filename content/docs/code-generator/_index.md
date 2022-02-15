+++
title = "Code Generator"
template = "page-dual.html"
+++

# Code Generator

Gacela Framework provides you some commands out-of-the-box to generate a `facade`, `factory`, `config`,
`dependency provider` or a full `module` with a single command.

- `make:module <target-namespace>`
  - Creates a new Facade, Factory, Config, and Dependency Provider.
- `make:file <target-namespace> [facade, factory, dependency-provider, config]`
  - Create one or more files of the specified type/s.


Example:
`./vendor/bin/gacela make:module App/TestModule`
