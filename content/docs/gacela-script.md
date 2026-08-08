---
title: Gacela script
description: "The Gacela command line tool: cache:warm, doctor, debug:dependencies, profile:report and more."
---

# Gacela script

Gacela ships a small CLI that assists you while building, inspecting and tuning modules in your application.

::: info
To use the *Gacela script*, you need the dependency `"symfony/console": "^6.4"`.
:::

All commands below are invoked through `vendor/bin/gacela` (Gacela's binary was moved to `bin/` in `1.8.0`).

## Getting started

### `init`

Create a `gacela.php` in the project root, so a new project starts from a file it can edit rather than a blank page.

```bash
vendor/bin/gacela init [-f|--force]
```

- `-f`, `--force`: overwrite an existing `gacela.php`. Without it, an existing file is left alone.

See [Bootstrap](/docs/bootstrap) for what belongs in the file once it exists.

## Module discovery

### `list:modules`

Render every module discovered under your project namespaces.

```bash
vendor/bin/gacela list:modules [--detailed|-d] [<filter>]
```

- `filter`: substring to narrow the output
- `-d`, `--detailed`: render each module's contents in detail

Scope which directories this (and `debug:modules`, `cache:warm`, `doctor`) scans with [`setAppModulePaths()`](/docs/bootstrap#application-module-paths).

### `debug:modules`

Walk every discovered module and inspect the constructor of each pillar (Facade, Factory, Config, Provider). Complements `list:modules` (structural view) and `debug:dependencies` (single-class deep-dive).

```bash
vendor/bin/gacela debug:modules [--detail|-d] [<filter>]
```

- Default output groups by module with per-pillar resolvable/unresolvable counts.
- `--detail` includes every parameter, not just unresolvable ones.
- `filter` accepts a namespace substring (e.g. `App\\Shop`) or a directory (e.g. `src/`).

### `debug:dependencies`

Inspect a single class's constructor and report each parameter's resolvability through the container.

```bash
vendor/bin/gacela debug:dependencies [--tree] <class|file>
```

- Accepts a fully qualified class name or a path to a PHP file declaring the class.
- Each parameter is tagged (`bound → target`, `autowirable`, `has default`, or `unresolvable` with a reason).
- Parameters annotated with [`#[Inject]`](/docs/inject) show up tagged `inject`, with the override concrete rendered inline when present.
- `--tree`: also walk the transitive dependencies, as the container resolves them. Use it when a parameter is resolvable but something further down the chain is not.

### `debug:module`

Inspect one module in depth: which pillars resolved, what the container holds for it, and its dependency tree. Where `debug:modules` scans everything shallowly, this goes deep on one.

```bash
vendor/bin/gacela debug:module [-j|--json] [-t|--tree] <module>
```

- `module`: the module name, or part of it.
- `-j`, `--json`: machine-readable output, for scripting or a CI assertion.
- `-t`, `--tree`: print only the dependency tree.

### `debug:graph`

Render the module dependency graph: which module imports which. This is the view that answers "did we just create a cycle", which no per-module command can see.

```bash
vendor/bin/gacela debug:graph [-f|--format=text] [-c|--compare-to=<file>] [--check] [--allowed-cycles=<file>] [<filter>]
```

- `filter`: only include modules matching this substring.
- `-f`, `--format`: `text` (default), `mermaid`, `graphviz` or `json`. `mermaid` pastes straight into a Markdown file; `json` is the format `--compare-to` reads.
- `--check`: exit non-zero when the graph contains a cycle, which is what makes this usable as a CI gate.
- `--allowed-cycles`: path to a JSON file of cycles you have reviewed and accepted, each with a `modules` list and a `reason`. Listed cycles stop failing `--check`; new ones still do.
- `-c`, `--compare-to`: path to a graph previously written with `--format=json`, to diff the current graph against it and see what a change did to the coupling.

### `debug:container`

Inspect the container's **user bindings and plugins only** (framework-internal services are excluded).

```bash
vendor/bin/gacela debug:container [<class>] [-s|--stats] [-t|--tree]
```

- No arguments (or `-s`, `--stats`): print container statistics — registered services, frozen services, factory services, bindings, cached dependencies and memory usage.
- `<class>` (or `-t`, `--tree` with a class): render the dependency tree for that fully qualified class name. Passing a class implies `--tree`; `--tree` without a class errors.

The same numbers are available in code as a typed object, so a health endpoint or a test can read them without parsing the table:

```php
$stats = (new ConsoleFacade())->getContainerStats();

$stats->registeredServices;   // ids this container holds an instance for
$stats->frozenServices;       // of those, how many are resolved and can no longer be overwritten
$stats->factoryServices;      // of those, how many are factory closures
$stats->bindings;             // abstract-to-concrete mappings registered here
$stats->cachedDependencies;   // classes this container has resolved at least once
$stats->processMemoryBytes;   // the whole PHP process, not this container
```

::: info
`processMemoryBytes` is an `int` rather than a preformatted string, so it can be compared and summed without parsing `"5.54 MB"` back into a number. It reports the whole PHP process via `memory_get_usage(true)`, not this container's share.
:::

## Caching & production

### `cache:warm`

Pre-resolve all module classes, write the persistent caches and (optionally) the merged configuration cache. Run this once per deploy in production.

```bash
vendor/bin/gacela cache:warm [-c|--clear] [-a|--attributes]
```

- `-c`, `--clear`: clear existing cache before warming (same as running `cache:clear` first)
- `-a`, `--attributes`: pre-scan and cache `#[ServiceMap]` attributes

Under the hood `cache:warm` batches file writes via `AbstractPhpFileCache::beginBatch()` / `commitBatch()` and flushes with atomic `rename()`, so a single write replaces the previous _N modules × 4 resolvers_ full-file rewrites.

### `cache:clear`

Remove every Gacela cache file.

```bash
vendor/bin/gacela cache:clear
```

Clears class-name caches, custom-service caches, the merged config cache (per `APP_ENV`), and cacheable-method entries.

## Configuration health

### `doctor`

Aggregate environmental and wiring health checks with per-check remediation hints. Bundled checks include cache staleness and suffix mismatches, plus any `ModuleHealthCheckInterface` you registered via `GacelaConfig::addHealthCheck()`.

```bash
vendor/bin/gacela doctor [--strict] [<filter>]
```

- `filter`: restrict module-scoped checks to a namespace substring.
- Exit code is `0` on OK/Warning and `1` on Error. Safe to wire into CI.
- `--strict`: fail on warnings too. Warnings are the ones that become errors later, so a pipeline that starts strict never accumulates them.

### `validate:config`

Validate the current Gacela configuration for errors and best practices.

```bash
vendor/bin/gacela validate:config
```

- Reports missing `gacela.php` (warning).
- Walks every registered binding and emits type-mismatch warnings with the expected interface/class, the actual type chain, and a fix hint.
- Interface-keyed bindings are checked as well (previously skipped).

### `debug:config`

Print the effective merged configuration as a table, after every `config/*.php` file and environment override is resolved.

```bash
vendor/bin/gacela debug:config [<filter>]
```

- `filter`: only show keys containing this substring.
- Backed by `Config::getAllValues()`, so it reflects exactly what your modules see at runtime.

## Profiling

### `profile:report`

Generate a performance report from the in-memory `Profiler`. Enable the profiler (`Profiler::getInstance()->enable()`) early in your bootstrap, run your code, then dump the report.

```bash
vendor/bin/gacela profile:report [--format=table|json|summary] [--sort=duration|memory|operation]
```

- `--format`: `table` (default), `json`, or `summary`.
- `--sort`: `duration` (default), `memory`, or `operation`.

## Code generation

### `make:file`

Generate a `Facade`, `Factory`, `Config`, `Provider`, or any combination of them.

```bash
vendor/bin/gacela make:file [-s|--short-name] <path> <filenames>...
```

- `path`: file path, e.g. `App/TestModule/TestSubModule`
- `filenames`: any combination of `facade`, `factory`, `config`, `provider`
- `-s`, `--short-name`: drop the module prefix from the generated class name

```bash
vendor/bin/gacela make:file App/TestModule facade factory provider
```

### `make:module`

Generate a full module: `Facade`, `Factory`, `Config`, and `Provider`.

```bash
vendor/bin/gacela make:module [-s|--short-name] [-t|--template=basic] [--minimal] [--with-tests] <path>
```

- `-s`, `--short-name`: drop the module prefix from the generated class names.
- `-t`, `--template`: what to scaffold.
  - `basic` (default): all four pillars, empty.
  - `service`: the same, plus a Domain service the Facade already calls, so the module does something on the first run.
  - `minimal`: Facade and Factory only, for a module that needs neither configuration nor cross-module dependencies.
- `--minimal`: shorthand for `--template=minimal`.
- `--with-tests`: also scaffold a Facade test. Applies to the `service` template only, since it is the one with behaviour worth asserting.

```bash
vendor/bin/gacela make:module -s App/TestModule
vendor/bin/gacela make:module --template=service --with-tests App/Checkout
```
