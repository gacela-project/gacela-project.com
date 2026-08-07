# Gacela script

Gacela ships a small CLI that assists you while building, inspecting and tuning modules in your application.

::: info
The CLI needs `symfony/console` 7 or 8. Gacela suggests rather than requires it, so add the package to applications that use the binary.
:::

All commands below are invoked through `vendor/bin/gacela`. Run it without arguments to list the installed commands, or `vendor/bin/gacela help <command>` for one command's complete options.

## Project setup

### `init`

Create the `gacela.php` bootstrap file required by every other command:

```bash
vendor/bin/gacela init [--force|-f]
```

`--force` overwrites an existing file.

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
vendor/bin/gacela debug:dependencies <class|file> [--tree]
```

- Accepts a fully qualified class name or a path to a PHP file declaring the class.
- Each parameter is tagged (`bound → target`, `autowirable`, `has default`, or `unresolvable` with a reason).
- Parameters annotated with [`#[Inject]`](/docs/inject) show up tagged `inject`, with the override concrete rendered inline when present.
- `--tree` appends the transitive dependency graph after applying bindings and contextual bindings. Nodes are marked `binding`, `instance`, `autowired`, or `unresolvable`; cycles are shown and cut.

### `debug:module`

Inspect a single module: its resolved Facade, Factory, Config and Provider, the container bindings it registers, and its dependency tree. Complements `debug:modules` (all modules, structural) and `debug:dependencies` (single class).

```bash
vendor/bin/gacela debug:module <module> [-j|--json] [-t|--tree]
```

- `module`: module name, or a part of it (required)
- `-j`, `--json`: output machine-readable JSON
- `-t`, `--tree`: only print the dependency tree

### `debug:graph`

Render the whole-app module dependency graph — which module imports which (edges via cross-module Facade usage).

```bash
vendor/bin/gacela debug:graph [<filter>] [-f|--format=text|mermaid|graphviz|json] [--check]
```

- `filter`: only include modules matching this substring
- `-f`, `--format`: `text` (default), `mermaid`, `graphviz`, or `json`
- `--check`: exit non-zero when an unreviewed dependency cycle exists
- `--allowed-cycles <file>`: JSON allowlist of reviewed cycles and their reasons
- `--compare-to <graph.json>`: diff the current graph against saved JSON output

The `mermaid` / `graphviz` formats are handy for architecture diagrams. Use `--check` in CI.

### `debug:container`

Inspect the container's **user bindings and plugins only** (framework-internal services are excluded).

```bash
vendor/bin/gacela debug:container [<class>] [-s|--stats] [-t|--tree]
```

- No arguments (or `-s`, `--stats`): print container statistics — registered services, frozen services, factory services, bindings, cached dependencies, and **process** memory usage.
- `<class>` (or `-t`, `--tree` with a class): render the dependency tree for that fully qualified class name. Passing a class implies `--tree`; `--tree` without a class errors.
- `-s`, `--stats` always takes precedence: `debug:container SomeClass --stats` prints statistics, not the dependency tree, even though a class was given.

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

Clears the project-scoped class-name, custom-service, and merged-config cache files, cacheable-method entries, and the container's in-process reflection memos.

## Configuration health

### `doctor`

Aggregate environmental and wiring health checks with per-check remediation hints. Bundled checks include cache staleness, suffix mismatches, and filename/class mismatches, plus any `ModuleHealthCheckInterface` registered through `GacelaConfig::addHealthCheck()`.

```bash
vendor/bin/gacela doctor [<filter>] [--strict]
```

- `filter`: restrict module-scoped checks to a namespace substring.
- By default warnings still exit `0`; `--strict` makes warnings fail too and is the recommended CI mode.

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
vendor/bin/gacela make:module [-s|--short-name] [-t|--template=basic|service|minimal] [--minimal] [--with-tests] <path>
```

- `-s`, `--short-name`: drop the module prefix from the generated class name
- `-t`, `--template`: `basic` (four pillars), `service` (four pillars plus a wired Domain service), or `minimal` (Facade and Factory only).
- `--minimal`: shorthand for `--template=minimal`.
- `--with-tests`: also scaffold a `GacelaTestCase`-based facade test (only valid with `--template=service`).

```bash
vendor/bin/gacela make:module -s App/TestModule
```

```bash
vendor/bin/gacela make:module --template=service --with-tests App/Checkout
```
