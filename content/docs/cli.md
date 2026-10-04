---
title: CLI reference
description: Inspect, diagnose, warm, profile, and visualize a Gacela application from the command line.
---

# CLI reference

Gacela ships a small CLI that helps you build, inspect and tune the modules in your application.

::: info
The CLI needs `symfony/console` 7 or 8. Gacela suggests the package but does not require it, so add it to any
application that uses the binary.
:::

Every command below runs through `vendor/bin/gacela`. Run it without arguments to list the installed commands, or run
`vendor/bin/gacela help <command>` for all of one command's options.

The binary walks up from the current directory to the nearest `vendor/autoload.php` and bootstraps with that project
root. Like other Composer tools, it works from anywhere in the tree. `gacela.php`, `setAppModulePaths()` and the cache
directory always resolve against the project root, never against the directory you run from. Before 2.1 the command
looked only in the working directory, and failed after a single `cd src`.

## Project setup

### `init`

Create the `gacela.php` bootstrap file that every other command needs:

```bash
vendor/bin/gacela init [--force|-f]
```

`--force` overwrites an existing file.

### `agents:install` [since 2.5]

Point the project's `AGENTS.md` at the guide Gacela ships for coding agents. The command writes between markers that
only it rewrites. See [coding agents](/docs/coding-agents).

```bash
vendor/bin/gacela agents:install
```

## Module discovery

### `list:modules`

List every module found under your project namespaces.

```bash
vendor/bin/gacela list:modules [--detailed|-d] [-j|--json] [<filter>]
```

- `filter`: substring to narrow the output
- `-d`, `--detailed`: show each module's contents in detail
- `-j`, `--json`: output machine-readable JSON

To limit which directories this command (and `debug:modules`, `cache:warm`, `doctor`) scans, use
[`setAppModulePaths()`](/docs/bootstrap#application-module-paths).

Any class that **descends from** `AbstractFacade` marks a module, not only a direct child. A project with its own base
Facade in between (`ShopFacade extends AppBaseFacade extends AbstractFacade`) used to vanish from `list:modules`,
`doctor`, `debug:graph` and `cache:warm`, and nothing reported it.

With no `appModulePaths` configured, the scan starts at the project root. It skips `vendor`, `node_modules` and any
hidden directory before entering them, rather than walking them and throwing the results away. The rule is narrow on
purpose: the scan enters every other directory. Assuming a project's `build/` or `data/` holds no modules is how
discovery starts silently missing them. An `appModulePaths` entry inside a skipped directory still works, because the
scan never filters the configured root itself.

### `debug:modules`

Walk every discovered module and inspect the constructor of each pillar (Facade, Factory, Config, Provider). It sits
between `list:modules` (the structure) and `debug:dependencies` (one class in depth).

```bash
vendor/bin/gacela debug:modules [--detail|-d] [--check] [-j|--json] [<filter>]
```

- By default, the output groups by module, with resolvable and unresolvable counts per pillar.
- `--detail` includes every parameter, not only the unresolvable ones.
- `--check` exits non-zero when a pillar has a parameter the container cannot satisfy, for CI.
- `-j`, `--json` reports as a JSON document instead of text.
- `filter` accepts a namespace substring (e.g. `App\\Shop`) or a directory (e.g. `src/`).

### `debug:dependencies`

Inspect one class's constructor and report whether the container can resolve each parameter.

```bash
vendor/bin/gacela debug:dependencies <class|file> [--tree] [-j|--json]
```

- Takes a fully qualified class name, or the path to a PHP file that declares the class.
- Tags each parameter: `bound → target`, `autowirable`, `has default`, or `unresolvable` with a reason.
- Tags parameters with [`#[Inject]`](/docs/inject) as `inject`, and shows the override concrete inline when there is
  one.
- `--tree` appends the transitive dependency graph, after applying bindings and contextual bindings. Nodes are marked
  `binding`, `instance`, `autowired` or `unresolvable`; cycles are shown and cut.
- `-j`/`--json`: report as a JSON document instead of text.

### `debug:module`

Inspect one module: its resolved Facade, Factory, Config and Provider, the container bindings it registers, and its
dependency tree. Compare `debug:modules` (all modules, whether each pillar's dependencies resolve) and `debug:dependencies` (one class).

```bash
vendor/bin/gacela debug:module <module> [-j|--json] [-t|--tree]
```

- `module`: module name, or a part of it (required)
- `-j`, `--json`: output machine-readable JSON
- `-t`, `--tree`: only print the dependency tree

### `debug:graph`

Draw the module dependency graph of the whole app: which module imports which, with an edge for each cross-module
Facade use.

```bash
vendor/bin/gacela debug:graph [<filter>] [-f|--format=text|mermaid|graphviz|json] [-j|--json] [--check]
```

- `filter`: only include modules matching this substring
- `-f`, `--format`: `text` (default), `mermaid`, `graphviz`, or `json`
- `-j`, `--json`: shorthand for `--format=json`
- `--check`: exit non-zero when an unreviewed dependency cycle exists
- `--allowed-cycles <file>`: JSON allowlist of reviewed cycles and their reasons
- `--rules <file>`: [since 2.2] exit non-zero on a dependency your
  [module rules file](/docs/module-boundaries#declaring-which-modules-may-depend-on-which) forbids. You cannot combine
  it with a filter argument: in a narrowed graph, a rule about a filtered-out module looks the same as a rule about a
  module that no longer exists.
- `-c`, `--compare-to <graph.json>`: diff the current graph against saved JSON output. It writes only the diff, so it
  refuses `--check`, `--rules` and `--allowed-cycles`: run the check as its own step. [since 2.7]

With `--check`, `--format=json` writes the findings as a report instead of lines, for a CI job that needs more than an
exit code: undeclared cycles, stale allow-list entries, forbidden dependencies and unknown rule namespaces. [since 2.2]

Use the `mermaid` and `graphviz` formats for architecture diagrams, and `--check` in CI.
See [Failing on dependency cycles](/docs/module-boundaries#failing-on-dependency-cycles) for the allowlist format and
the CI comparison workflow.

The command reads imports with PHP's tokenizer, not line by line. Grouped (`use App\Shop\{A, B};`), multiline and
aliased imports all produce edges, and so do `use function` and `use const`. A leading `\` on an import and an uppercase
`USE` no longer hide a dependency. Modules resolve through a name index instead of comparing every import against every
module, which keeps the scan cheap on large graphs.

### `debug:container`

Inspect the container's **user bindings and plugins only**. Framework-internal services are left out.

```bash
vendor/bin/gacela debug:container [<class>] [-s|--stats] [-t|--tree] [-j|--json]
```

- No arguments (or `-s`, `--stats`): print container statistics: registered services, frozen services, factory
  services, bindings, cached dependencies, and **process** memory usage.
- `<class>` (or `-t`, `--tree` with a class): show the dependency tree for that fully qualified class name. A class
  implies `--tree`; `--tree` without a class is an error.
- `-s`, `--stats` always wins: `debug:container SomeClass --stats` prints statistics, not the dependency tree, even with
  a class given.
- `-j`, `--json`: report as a JSON document instead of text.

### `debug:provides` [since 2.3]

Find which Provider declares an id with [`#[Provides]`](/docs/provider#more-provides-patterns). `debug:module` cannot
answer this, because it needs you to know the module already.

```bash
vendor/bin/gacela debug:provides [<id>] [-j|--json]
```

- `id`: only ids containing this text; omit it to list every declaration
- `-j`, `--json`: output machine-readable JSON

The table shows the id, the module, the Provider and the method. Two modules that declare the same id do not collide,
because each resolves through its own container, so **both rows stay**. That is the reason to look here at all.

It lists only ids declared with the attribute. Finding the ids a Provider registers in code with `$container->set()`
would mean running the Provider.

### `debug:plugins` [since 2.5]

List the members of each [plugin stack](/docs/extensions#plugin-stacks) and the ids of each tag, in the order they are
read, plus the `#[AsListener]` methods. Each entry shows where it was declared: `gacela.php` (packages included) or the
attribute.

```bash
vendor/bin/gacela debug:plugins [-j|--json]
```

Ids that a module's Provider tags at runtime stay in that module's container, so the command does not list them. A
`#[Plugin]` that names a stack nobody declared is listed as never read.

### `debug:events` [since 2.4]

List every [event](/docs/events) the framework can dispatch, plus your project's own. It shows which ones have a
listener, and which are dispatched on the class-resolution hot path.

```bash
vendor/bin/gacela debug:events [<filter>] [-l|--listened] [-j|--json]
```

- `filter`: only events whose class name contains this text
- `-l`, `--listened`: only events something listens to
- `-j`, `--json`: output machine-readable JSON

A specific listener matches by inheritance, so a registration can cover an event without naming it. The listener
column names the target that does. The command finds project events under the paths discovery already walks: a class
that implements `GacelaEventInterface` or is named `*Event`. It marks them `project`. It also says when
`disableEventListeners()` is in effect or a custom dispatcher is installed, because a supplied dispatcher passes events
on to a bus the command cannot see into.

[`#[AsListener]`](/docs/events#your-own-events) methods appear beside the `gacela.php` listeners, marked as such, and
as `attributeListeners` in `--json`. `--listened` counts an event that only they handle. They never match framework
events, because the framework's dispatch sites do not read them. [since 2.6]

## Caching & production

### `cache:warm`

Pre-resolve every module class, and write the persistent caches and, optionally, the merged configuration cache. Run
it once per deploy in production.

```bash
vendor/bin/gacela cache:warm [-c|--clear] [-a|--attributes]
```

- `-c`, `--clear`: clear the existing cache before warming (the same as running `cache:clear` first)
- `-a`, `--attributes`: pre-scan and cache `#[ServiceMap]` attributes, and store the `#[Plugin]`, `#[Tag]` and
  `#[AsListener]` members [since 2.5]

`cache:warm` batches file writes with `AbstractPhpFileCache::beginBatch()` / `commitBatch()` and flushes with an atomic
`rename()`. One write replaces the old _N modules × 4 resolvers_ full-file rewrites.

**Exit code.** As of 2.1 the command exits non-zero when module discovery fails or any module fails to warm, so a broken
deploy step does not show green. Before, it always exited `0` and printed the failures as warnings. It writes the merged
configuration cache only when the file cache is enabled.

When it writes no merged configuration cache, it says why: a config source changed in the same second, or the cache
directory is not writable. The next bootstrap writes it. [since 2.6]

### `cache:clear`

Remove every Gacela cache file.

```bash
vendor/bin/gacela cache:clear
```

It clears the project's class-name, custom-service and merged-config cache files, the cacheable-method entries, and the
container's in-process reflection memos.

## Configuration health

### `doctor`

Run health checks on the environment and the wiring, each with a hint on how to fix what it finds. The built-in checks
include cache staleness, suffix mismatches and filename/class mismatches, plus any `ModuleHealthCheckInterface`
registered through `GacelaConfig::addHealthCheck()`. It also checks the
[declared config schema](/docs/config#declaring-a-config-schema), and reports a [published stub](#stubs-publish) that
lost a placeholder or sits under a name the scaffolder never reads. [since 2.2]

```bash
vendor/bin/gacela doctor [<filter>] [--strict] [--only-problems] [--format=text|json] [-j|--json]
```

- `filter`: limit module-scoped checks to a namespace substring.
- By default, warnings still exit `0`. `--strict` makes warnings fail too; use it in CI.
- `--only-problems`: report only the checks that found something.
- `--format`: `text` (default) or `json`.
- `-j`, `--json`: shorthand for `--format=json`.

The staleness check also covers the **merged configuration cache**. It compares it against every file `ConfigLoader`
would read: base patterns, environment patterns and local overrides. A cache written by `cache:warm` keeps serving old
values after a `config/*.php` file changes, while every class-name entry stays fresh. That is how `doctor` used to
report "all cache entries are fresh" on a stale configuration.

### `validate:config`

Check the current Gacela configuration for errors and best practices.

```bash
vendor/bin/gacela validate:config [--strict] [--format=text|json] [-j|--json]
```

- Warns when `gacela.php` is missing.
- Walks every registered binding and warns on a type mismatch, with the expected interface or class, the actual type
  chain, and a hint on the fix.
- Checks interface-keyed bindings too (they used to be skipped).
- Accepts non-class binding keys (plain string ids such as `'db.dsn'`) instead of reporting them as non-existent.
- Checks the configuration against the [declared schema](/docs/config#declaring-a-config-schema), and exits non-zero
  when a declared key is missing or has the wrong type. [since 2.2]
- `--strict`: exit with a failure code on warnings too, for CI.
- `--format`: `text` (default) or `json`; `-j`/`--json` is short for `--format=json`.

::: info No side effects
As of 2.1 the command checks the dependency graph statically, instead of calling `$container->get()` on every binding
to see what throws. Resolving a binding to check it also **ran** it, so a constructor that opened a connection or wrote
a file did so during validation. A binding backed by a runtime factory cannot be walked statically, so the command
reports it as skipped instead of running it.
:::

### `debug:config`

Print the merged configuration your modules get as a table, after resolving every `config/*.php` file and environment
override.

```bash
vendor/bin/gacela debug:config [<filter>] [--format=text|json] [-j|--json]
```

- `filter`: only show keys that contain this substring.
- `--format`: `text` (default) or `json`; `-j`/`--json` is short for `--format=json`.
- It reads `Config::getAllValues()`, so it shows exactly what your modules see at runtime.
- Each key is marked `declared`, `undeclared` or `missing` against the
  [declared schema](/docs/config#declaring-a-config-schema). The table flags the keys the schema does *not* cover, and
  lists a declared key that nothing provides, even though it has no value to show. [since 2.2]

## Profiling

### `profile:report`

Build a performance report from the in-memory `Profiler`. Enable the profiler (`Profiler::getInstance()->enable()`)
early in your bootstrap, run your code, then dump the report. [Profiling](/docs/profiling) documents the Profiler API
and how spans work.

```bash
vendor/bin/gacela profile:report [-f|--format=table|json|summary] [-j|--json] [-s|--sort=duration|memory|operation]
```

- `-f`, `--format`: `table` (default), `json`, or `summary`. `-j`/`--json` is short for `--format=json`.
- `-s`, `--sort`: `duration` (default), `memory`, or `operation`.

`--format=json` writes `entries`, `stats` and, since 2.3, `unfinished`: the operations started and never stopped,
keyed `operation:subject`, with a count of how many of each are still open.

```json
{
  "entries": [],
  "stats": {},
  "unfinished": { "db-query:orders": 1 }
}
```

The profiler ignores a `stop()` whose operation or subject does not match its `start()`, because it has no start time
to measure from. Before 2.3 the span vanished from the report and looked like code nobody had instrumented. Naming the
unmatched start turns "my operation is missing" into the typo that caused it. The text report says the same.

The profiler keeps a stack of start times per operation, so nested and recursive spans each record their own duration.
Starting an operation that was already running used to overwrite the outer timestamp and merge both into one entry.
`disable()` drops every span still running: a span left open while profiling is off can never close, and would pair a
later `stop()` with a stale start.

## Code generation

### `make:file`

Generate a `Facade`, `Factory`, `Config`, `Provider`, or any combination of them.

```bash
vendor/bin/gacela make:file [-s|--short-name] [-f|--force] [--dry-run] <path> <filenames>...
```

- `path`: file path, for example `App/TestModule/TestSubModule`
- `filenames`: any combination of `facade`, `factory`, `config`, `provider`
- `-s`, `--short-name`: drop the module prefix from the generated class name
- `-f`, `--force`: replace files that already exist [since 2.3]
- `--dry-run`: report the files that would be written, and write nothing [since 2.3]

The command refuses a kind Gacela does not have, instead of guessing: `Repository` exits `1` instead of producing a
`Factory`. Abbreviations of the four pillars still work.

```bash
vendor/bin/gacela make:file App/TestModule facade factory provider
```

Both generators find the target directory by stripping **only the matched psr-4 prefix** from the path. Replacing the
namespace text everywhere also rewrote it inside the module name, so `App/Application` against `App\ => src/` produced
`src/srclication`. A psr-4 entry mapped to a list of directories works: the generators use the first, because Composer
looks there first.

### `make:module`

Generate a full module: `Facade`, `Factory`, `Config`, and `Provider`.

```bash
vendor/bin/gacela make:module [-s|--short-name] [-t|--template=basic|service|minimal] [--minimal] [--with-tests] [-f|--force] [--dry-run] <path>
```

- `-s`, `--short-name`: drop the module prefix from the generated class name
- `-t`, `--template`: `basic` (four pillars), `service` (four pillars plus a wired Domain service), or `minimal` (Facade
  and Factory only).
- `--minimal`: shorthand for `--template=minimal`.
- `--with-tests`: also scaffold a `GacelaTestCase`-based facade test (only valid with `--template=service`).
- `-f`, `--force`: replace files that already exist [since 2.3]
- `--dry-run`: report the files that would be written, and write nothing [since 2.3]

Both generators check every target before writing any. Without `--force`, a run that would replace an existing file
writes nothing, names the files in the way, and exits `1`. [since 2.3]

```bash
vendor/bin/gacela make:module -s App/TestModule
```

```bash
vendor/bin/gacela make:module --template=service --with-tests App/Checkout
```

### `stubs:publish` [since 2.2]

`make:module` and `make:file` generate from templates that ship with Gacela. `stubs:publish` copies them into the
project (`stubs/gacela/` by default; use `GacelaConfig::setStubsDir()` to put them elsewhere), so `make:*` generates
your house style:

```bash
vendor/bin/gacela stubs:publish                    # every stub
vendor/bin/gacela stubs:publish --template=basic   # one template set
vendor/bin/gacela stubs:publish --force            # replace ones already published
vendor/bin/gacela stubs:publish --dry-run          # report what would be published, write nothing
```

From then on, each generated file uses the project's stub when there is one, and the built-in template when there is
not. This works **per file**, so publishing your Facade stub does not freeze the Factory at the version you copied.
Without `--force`, the command overwrites nothing already published: it is a file somebody changed on purpose.

Every stub substitutes `$NAMESPACE$`, `$MODULE_NAME$` and `$CLASS_NAME$`. [`doctor`](#doctor) reports a published stub
that lost `$NAMESPACE$` or `$CLASS_NAME$`, and one filed under a name the scaffolder does not read. Otherwise an edit
that never takes effect looks exactly like one that did.

### `ide:meta` [since 2.3]

Generate editor metadata for [`getProvidedDependency()`](/docs/static-analysis#typed-provided-dependencies) from the
`#[Provides]` attributes, so the editor resolves a string id to a real type.

```bash
vendor/bin/gacela ide:meta [--dry-run]
```

- `--dry-run`: report what would change, write nothing

It writes `.phpstorm.meta.php/gacela.meta.php`. The directory form is on purpose: a project with a hand-written
`.phpstorm.meta.php` file keeps it.

An id that two Providers register with different types is **listed, not written**. The editor map covers the whole
application, while `getProvidedDependency()` reads the calling module's container, so there is no single answer to
write. Saying nothing would make the id look unsupported.

Static analysis needs none of this. Both analysers already type a class-string key; this covers the string ids they
cannot.

### `dto:generate` [since 2.3]

Write the immutable class for every data shape declared with
[`declareDtoSchema()`](/docs/dto-schema): typed getters, `with*()` copies, `toArray()` and `fromArray()`.

```bash
vendor/bin/gacela dto:generate [--dry-run] [--check]
```

- `--dry-run`: report what would change, write nothing
- `--check`: like `--dry-run`, and exit non-zero when a class would be written

Unlike `make:*`, this generates a **derived** file, not a starting point. The declaration is the source of truth and
the class is regenerated from it, so nobody edits the result. Regenerating an unchanged declaration gives a
byte-identical file.

The command places each class through the project's own `psr-4` autoload map, longest matching prefix first. When no
prefix covers a shape's namespace, it reports the shape and exits non-zero instead of writing it somewhere else.

Run `--check` in CI to fail on a declaration nobody regenerated. See [DTO schema](/docs/dto-schema) for the
declaration syntax and the shape of the generated class.

### `migrate:service-map` [since 2.4]

Write the [`#[ServiceMap]`](/docs/service-map) attribute for every pillar accessor still resolved from a `@method`
docblock, across the whole project in one run. That resolution is deprecated in 2.x and removed in 3.0. The runtime
notice only fires for accessors a run reaches, so a migration driven by notices covers only the code paths your tests
run.

```bash
vendor/bin/gacela migrate:service-map [<filter>] [--dry-run]
```

- `filter`: only files whose path contains this text
- `--dry-run`: report what would change and write nothing

The command adds only the attribute and, when missing, its import. Nothing else in the file moves, and a second run
changes nothing. It leaves alone an accessor whose `@method` type is not a single class name (`A|B`, `?A`, `array<A>`,
`self`).
