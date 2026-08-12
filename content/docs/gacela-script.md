---
title: CLI reference
description: Inspect, diagnose, warm, profile, and visualize a Gacela application from the command line.
---

# CLI reference

Gacela ships a small CLI that assists you while building, inspecting and tuning modules in your application.

::: info
The CLI needs `symfony/console` 7 or 8. Gacela suggests rather than requires it, so add the package to
applications that use the binary.
:::

All commands below are invoked through `vendor/bin/gacela`. Run it without arguments to list the installed commands, or
`vendor/bin/gacela help <command>` for one command's complete options.

The binary walks up from the current directory to the nearest `vendor/autoload.php` and bootstraps with that project
root, so it works from anywhere in the tree the way other Composer tooling does. `gacela.php`, `setAppModulePaths()` and
the cache directory always resolve against the project root, never against the directory you happened to run from.
Before 2.1 the command looked only in the working directory and failed after a single `cd src`.

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

Scope which directories this (and `debug:modules`, `cache:warm`, `doctor`) scans with [
`setAppModulePaths()`](/docs/bootstrap#application-module-paths).

A module is recognized by any class that **descends from** `AbstractFacade`, not only a direct child of it. A project
with its own base Facade in between (`ShopFacade extends AppBaseFacade extends AbstractFacade`) used to disappear from
`list:modules`, `doctor`, `debug:graph` and `cache:warm`, with nothing reporting the omission.

With no `appModulePaths` configured the scan starts at the project root. It prunes `vendor`, `node_modules` and any
hidden directory before descending, rather than walking them and discarding the results afterwards. The rule is
deliberately narrow: everything else is descended into, because assuming a project's `build/` or `data/` holds no
modules is how discovery starts silently missing them. An `appModulePaths` entry pointing inside a pruned directory
still works, since the configured root itself is never filtered.

### `debug:modules`

Walk every discovered module and inspect the constructor of each pillar (Facade, Factory, Config, Provider). Complements
`list:modules` (structural view) and `debug:dependencies` (single-class deep-dive).

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
- Parameters annotated with [`#[Inject]`](/docs/inject) show up tagged `inject`, with the override concrete rendered
  inline when present.
- `--tree` appends the transitive dependency graph after applying bindings and contextual bindings. Nodes are marked
  `binding`, `instance`, `autowired`, or `unresolvable`; cycles are shown and cut.

### `debug:module`

Inspect a single module: its resolved Facade, Factory, Config and Provider, the container bindings it registers, and its
dependency tree. Complements `debug:modules` (all modules, structural) and `debug:dependencies` (single class).

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
- `--rules <file>`: [since 2.2] exit non-zero on a dependency your
  [module rules file](/docs/static-analysis#declaring-which-modules-may-depend-on-which) forbids. Cannot be combined
  with a filter argument: in a narrowed graph, a rule about a filtered-out module is indistinguishable from a rule
  about a module that no longer exists.
- `--compare-to <graph.json>`: diff the current graph against saved JSON output

With `--check`, `--format=json` writes the findings as a report instead of lines, for a CI job that wants more than an
exit code: undeclared cycles, stale allow-list entries, forbidden dependencies and unknown rule namespaces. [since 2.2]

The `mermaid` / `graphviz` formats are handy for architecture diagrams. Use `--check` in CI.
See [Failing on dependency cycles](/docs/static-analysis#failing-on-dependency-cycles) for the allowlist format and the
CI comparison workflow.

Imports are read with PHP's tokenizer rather than matched line by line, so grouped (`use App\Shop\{A, B};`), multiline
and aliased imports all produce edges, as do `use function` and `use const`. A leading `\` on an import and an uppercase
`USE` no longer hide a dependency. Modules are resolved through a name index instead of comparing every import against
every module, which is what makes the scan cheap on large graphs.

### `debug:container`

Inspect the container's **user bindings and plugins only** (framework-internal services are excluded).

```bash
vendor/bin/gacela debug:container [<class>] [-s|--stats] [-t|--tree]
```

- No arguments (or `-s`, `--stats`): print container statistics — registered services, frozen services, factory
  services, bindings, cached dependencies, and **process** memory usage.
- `<class>` (or `-t`, `--tree` with a class): render the dependency tree for that fully qualified class name. Passing a
  class implies `--tree`; `--tree` without a class errors.
- `-s`, `--stats` always takes precedence: `debug:container SomeClass --stats` prints statistics, not the dependency
  tree, even though a class was given.

## Caching & production

### `cache:warm`

Pre-resolve all module classes, write the persistent caches and (optionally) the merged configuration cache. Run this
once per deploy in production.

```bash
vendor/bin/gacela cache:warm [-c|--clear] [-a|--attributes]
```

- `-c`, `--clear`: clear existing cache before warming (same as running `cache:clear` first)
- `-a`, `--attributes`: pre-scan and cache `#[ServiceMap]` attributes

Under the hood `cache:warm` batches file writes via `AbstractPhpFileCache::beginBatch()` / `commitBatch()` and flushes
with atomic `rename()`, so a single write replaces the previous _N modules × 4 resolvers_ full-file rewrites.

**Exit code.** As of 2.1 the command exits non-zero when module discovery fails or any module fails to warm, so a broken
deploy step is not reported green. It previously always exited `0` and printed the failures as warnings. The merged
configuration cache is only written when the file cache is enabled.

### `cache:clear`

Remove every Gacela cache file.

```bash
vendor/bin/gacela cache:clear
```

Clears the project-scoped class-name, custom-service, and merged-config cache files, cacheable-method entries, and the
container's in-process reflection memos.

## Configuration health

### `doctor`

Aggregate environmental and wiring health checks with per-check remediation hints. Bundled checks include cache
staleness, suffix mismatches, and filename/class mismatches, plus any `ModuleHealthCheckInterface` registered through
`GacelaConfig::addHealthCheck()`. It also checks the [declared config schema](/docs/config#declaring-a-config-schema)
and reports a [published stub](#stubs-publish) that lost a placeholder or sits under a name the scaffolder never
reads. [since 2.2]

```bash
vendor/bin/gacela doctor [<filter>] [--strict]
```

- `filter`: restrict module-scoped checks to a namespace substring.
- By default warnings still exit `0`; `--strict` makes warnings fail too and is the recommended CI mode.

The staleness check covers the **merged configuration cache** too, compared against every file `ConfigLoader` would
read: base patterns, environment patterns and local overrides. That cache keeps serving values after a `config/*.php`
file changes while every class-name entry stays fresh, which is how `doctor` used to report "all cache entries are
fresh" on a stale configuration.

### `validate:config`

Validate the current Gacela configuration for errors and best practices.

```bash
vendor/bin/gacela validate:config
```

- Reports missing `gacela.php` (warning).
- Walks every registered binding and emits type-mismatch warnings with the expected interface/class, the actual type
  chain, and a fix hint.
- Interface-keyed bindings are checked as well (previously skipped).
- Non-class binding keys (plain string ids such as `'db.dsn'`) are accepted rather than reported as non-existent.
- Checks the configuration against the [declared schema](/docs/config#declaring-a-config-schema), exiting non-zero when
  a declared key is unsatisfied. [since 2.2]

::: info No side effects
As of 2.1 the command validates the dependency graph statically instead of calling `$container->get()` on every binding
to see what throws. Resolving a binding to check it also **ran** it, so a constructor that opened a connection or wrote
a file did so during validation. Bindings backed by a runtime factory cannot be walked statically and are reported as
skipped rather than executed.
:::

### `debug:config`

Print the effective merged configuration as a table, after every `config/*.php` file and environment override is
resolved.

```bash
vendor/bin/gacela debug:config [<filter>]
```

- `filter`: only show keys containing this substring.
- Backed by `Config::getAllValues()`, so it reflects exactly what your modules see at runtime.
- Each key is marked `declared`, `undeclared` or `missing` against the
  [declared schema](/docs/config#declaring-a-config-schema), so the table also flags the keys the schema does *not*
  cover, and lists a declared key nothing provides even though it has no value to show. [since 2.2]

## Profiling

### `profile:report`

Generate a performance report from the in-memory `Profiler`. Enable the profiler (`Profiler::getInstance()->enable()`)
early in your bootstrap, run your code, then dump the report.

```bash
vendor/bin/gacela profile:report [--format=table|json|summary] [--sort=duration|memory|operation]
```

- `--format`: `table` (default), `json`, or `summary`.
- `--sort`: `duration` (default), `memory`, or `operation`.

The profiler keeps a stack of start times per operation, so nested and recursive spans each record their own duration.
Starting an operation that was already in flight used to overwrite the outer timestamp and collapse both into one entry.
Calling `disable()` drops whatever is still in flight, since a span left open while profiling is off can never be closed
and would otherwise pair a later `stop()` with a stale start.

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

Both generators resolve the target directory by stripping **only the matched psr-4 prefix** from the path. Replacing the
namespace text everywhere it occurred rewrote it inside the module name too, so `App/Application` against `App\ => src/`
produced `src/srclication`. A psr-4 entry mapped to a list of directories is accepted; the first is used, because that
is where Composer itself looks first.

### `make:module`

Generate a full module: `Facade`, `Factory`, `Config`, and `Provider`.

```bash
vendor/bin/gacela make:module [-s|--short-name] [-t|--template=basic|service|minimal] [--minimal] [--with-tests] <path>
```

- `-s`, `--short-name`: drop the module prefix from the generated class name
- `-t`, `--template`: `basic` (four pillars), `service` (four pillars plus a wired Domain service), or `minimal` (Facade
  and Factory only).
- `--minimal`: shorthand for `--template=minimal`.
- `--with-tests`: also scaffold a `GacelaTestCase`-based facade test (only valid with `--template=service`).

```bash
vendor/bin/gacela make:module -s App/TestModule
```

```bash
vendor/bin/gacela make:module --template=service --with-tests App/Checkout
```

### `stubs:publish` [since 2.2]

`make:module` and `make:file` generate from templates that ship with Gacela. `stubs:publish` copies them into the
project, `stubs/gacela/` by default, `GacelaConfig::setStubsDir()` to put them elsewhere, so `make:*` generates your
house style:

```bash
vendor/bin/gacela stubs:publish                    # every stub
vendor/bin/gacela stubs:publish --template=basic   # one template set
vendor/bin/gacela stubs:publish --force            # replace ones already published
```

From then on a generated file uses the project's stub when there is one and the built-in template when there is not,
**per file**, so publishing your Facade stub does not freeze the Factory at the version it was copied from. Without
`--force` nothing already published is overwritten: it is a file somebody changed on purpose.

Every stub substitutes `$NAMESPACE$`, `$MODULE_NAME$` and `$CLASS_NAME$`. [`doctor`](#doctor) reports a published stub
that lost `$NAMESPACE$` or `$CLASS_NAME$`, and one filed under a name the scaffolder does not read: an edit that never
takes effect looks exactly like one that did.
