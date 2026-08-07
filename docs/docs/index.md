---
title: Documentation
description: Choose the shortest path from installation to a production-ready Gacela 2.0 module.
next: /docs/quickstart
---

# Gacela documentation

Build modular PHP applications with a small, predictable vocabulary: a **Facade** exposes a module, a **Factory** creates its internal services, a **Provider** supplies external dependencies, and a **Config** reads application settings.

::: tip New to Gacela?
Start with the [Quickstart](/docs/quickstart). It takes you from installation to a working module, then points to the next concept only when you need it.
:::

## Choose your path

<div class="gz-doc-grid">
  <a class="gz-doc-card" href="/docs/quickstart">
    <strong>Build your first module</strong>
    <span>Install Gacela and create a working Facade and Factory.</span>
  </a>
  <a class="gz-doc-card" href="/docs/getting-dependencies">
    <strong>Wire a dependency</strong>
    <span>Choose between Factory, Provider, bindings, Inject, and Service Map.</span>
  </a>
  <a class="gz-doc-card" href="/docs/upgrading">
    <strong>Upgrade to 2.0</strong>
    <span>Check requirements, replace removed APIs, and verify the migration.</span>
  </a>
  <a class="gz-doc-card" href="/used-in">
    <strong>Study a real application</strong>
    <span>See how the Phel language project structures production modules.</span>
  </a>
</div>

## The module boundary

| Class | Responsibility | Called by |
|---|---|---|
| [Facade](/docs/facade) | The module's public API | Other modules and entry points |
| [Factory](/docs/factory) | Internal object construction | The module's Facade and services |
| [Provider](/docs/provider) | Cross-module and infrastructure dependencies | The module's Factory |
| [Config](/docs/config) | Typed application settings | The module's Factory |

You do not need all four classes in every module. Start with a Facade and Factory; add a Provider when the module crosses a boundary, and a Config when it needs application settings.

## Common tasks

- [Bootstrap an application](/docs/bootstrap)
- [Configure container bindings and lifetimes](/docs/bindings)
- [Resolve a service in framework-managed code](/docs/inject)
- [Inspect modules and dependency cycles from the CLI](/docs/gacela-script)
- [Add health checks](/docs/health-checks)
- [Test with isolated container state](/docs/testing)
- [Enforce boundaries with PHPStan or Psalm](/docs/static-analysis)

## Documentation for coding agents

Every page has **Copy Markdown** and **View Markdown** actions above its title. Machine-readable entry points are also available:

- [`/llms.txt`](/llms.txt) — compact index with page descriptions
- [`/llms-full.txt`](/llms-full.txt) — the complete documentation in one context file
- Append `.md` to a page URL — for example, [`/docs/bootstrap.md`](/docs/bootstrap.md)

When prompting an agent, give it `https://gacela-project.com/llms.txt` for discovery or `https://gacela-project.com/llms-full.txt` when the entire documentation fits the task's context budget.
