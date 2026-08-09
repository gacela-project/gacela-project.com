---
title: Documentation
description: Choose the shortest path from installation to a production-ready Gacela 2.0 module.
---

# Gacela documentation

Build modular PHP applications with a small, predictable vocabulary: a **Facade** exposes a module, a **Factory**
creates its internal services, a **Provider** supplies external dependencies, and a **Config** reads application
settings.

::: tip New to Gacela?
Start with the [Quickstart](/docs/quickstart). It takes you from installation to a working module, then points to the
next concept only when you need it.
:::

## Choose your path

<div class="card-grid">
  <a class="card-grid__card" href="/docs/quickstart">
    <strong>Build your first module</strong>
    <span>Install Gacela and create a working Facade and Factory.</span>
  </a>
  <a class="card-grid__card" href="/docs/getting-dependencies">
    <strong>Wire a dependency</strong>
    <span>Choose between Factory, Provider, bindings, Inject, and Service Map.</span>
  </a>
  <a class="card-grid__card" href="/docs/upgrading">
    <strong>Upgrade to 2.0</strong>
    <span>Check requirements, replace removed APIs, and verify the migration.</span>
  </a>
  <a class="card-grid__card" href="/used-in">
    <strong>Study a real application</strong>
    <span>See how the Phel language project structures production modules.</span>
  </a>
</div>

## Recommended journey

Follow this sequence once; use search and the task index after that:

1. **Get a working result:** complete the [Quickstart](/docs/quickstart) and run `example.php`.
2. **Understand the boundary:** read [Facade](/docs/facade) and [Factory](/docs/factory) while following the call
   inward.
3. **Add real dependencies:** use the [dependency decision guide](/docs/getting-dependencies), then add Provider or
   Config only when required.
4. **Make it production-ready:** add [tests](/docs/testing), [static analysis](/docs/static-analysis),
   and [health checks](/docs/health-checks).
5. **Inspect a real system:** compare the result with the [Phel production case study](/used-in).

::: tip Find an answer quickly
Press <kbd>⌘ K</kbd> on macOS or <kbd>Ctrl K</kbd> on Windows/Linux to search every page.
For wiring questions, start with [Getting dependencies](/docs/getting-dependencies) instead of browsing individual APIs.
:::

## The module boundary

| Class                      | Responsibility                               | Called by                        |
|----------------------------|----------------------------------------------|----------------------------------|
| [Facade](/docs/facade)     | The module's public API                      | Other modules and entry points   |
| [Factory](/docs/factory)   | Internal object construction                 | The module's Facade and services |
| [Provider](/docs/provider) | Cross-module and infrastructure dependencies | The module's Factory             |
| [Config](/docs/config)     | Typed application settings                   | The module's Factory             |

You do not need all four classes in every module. Start with a Facade and Factory; add a Provider when the module
crosses a boundary, and a Config when it needs application settings.

## Design outside-in

Gacela works best when you follow the request from the caller into the module:

1. Write the controller, command, or script call you want to make.
2. Turn that call into a small Facade method.
3. Let the Factory construct the service that fulfills it.
4. Add a Provider or Config only when that service needs something outside the module.

This keeps the public API driven by real use cases instead of exposing internal classes speculatively.
The [Quickstart](/docs/quickstart) demonstrates the complete flow.

## Common tasks

- [Bootstrap an application](/docs/bootstrap)
- [Configure container bindings and lifetimes](/docs/bindings)
- [Resolve a service in framework-managed code](/docs/inject)
- [Inspect modules and dependency cycles from the CLI](/docs/gacela-script)
- [Add health checks](/docs/health-checks)
- [Test with isolated container state](/docs/testing)
- [Enforce boundaries with PHPStan or Psalm](/docs/static-analysis)

## Documentation for coding agents

Machine-readable entry points are available:

- [`/llms.txt`](/llms.txt) — compact index with page descriptions
- [`/llms-full.txt`](/llms-full.txt) — the complete documentation in one context file
- Append `.md` to a page URL — for example, [`/docs/bootstrap.md`](/docs/bootstrap.md)

When prompting an agent, give it `https://gacela-project.com/llms.txt` for discovery or
`https://gacela-project.com/llms-full.txt` when the entire documentation fits the task's context budget.
