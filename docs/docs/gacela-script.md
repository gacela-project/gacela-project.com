# Gacela script

Gacela ships a small CLI that assists you while building, inspecting and tuning modules in your application.

::: info
To use the *Gacela script*, you need the dependency `"symfony/console": "^5.4 || ^6.4 || ^7.0"`.
:::

All commands below are invoked through `vendor/bin/gacela` (Gacela's binary was moved to `bin/` in `1.8.0`).

## Module discovery

### `list:modules`

Render every module discovered under your project namespaces.

```bash
vendor/bin/gacela list:modules [--detailed|-d] [<filter>]
```

- `filter` — substring to narrow the output
- `-d`, `--detailed` — render each module's contents in detail

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
vendor/bin/gacela debug:dependencies <class|file>
```

- Accepts a fully qualified class name or a path to a PHP file declaring the class.
- Each parameter is tagged (`bound → target`, `autowirable`, `has default`, or `unresolvable` with a reason).
- Parameters annotated with `#[Inject]` show up tagged `inject`, with the override concrete rendered inline when present.

### `debug:container`

Print a snapshot of the main container: registered services, frozen services, factory services, bindings, cached dependencies and current memory usage.

```bash
vendor/bin/gacela debug:container
```

## Caching & production

### `cache:warm`

Pre-resolve all module classes, write the persistent caches and (optionally) the merged configuration cache. Run this once per deploy in production.

```bash
vendor/bin/gacela cache:warm [-c|--clear] [-a|--attributes] [-p|--parallel]
```

- `-c`, `--clear` — clear existing cache before warming (same as running `cache:clear` first)
- `-a`, `--attributes` — pre-scan and cache `#[ServiceMap]` attributes
- `-p`, `--parallel` — warm modules in parallel via PHP 8.1 Fibers (up to 5× faster on large code bases)

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
vendor/bin/gacela doctor [<filter>]
```

- `filter` — restrict module-scoped checks to a namespace substring.
- Exit code is `0` on OK/Warning and `1` on Error — safe to wire into CI.

### `validate:config`

Validate the current Gacela configuration for errors and best practices.

```bash
vendor/bin/gacela validate:config
```

- Reports missing `gacela.php` (warning).
- Walks every registered binding and emits type-mismatch warnings with the expected interface/class, the actual type chain, and a fix hint.
- Interface-keyed bindings are checked as well (previously skipped).

## Profiling

### `profile:report`

Generate a performance report from the in-memory `Profiler`. Enable the profiler (`Profiler::getInstance()->enable()`) early in your bootstrap, run your code, then dump the report.

```bash
vendor/bin/gacela profile:report [--format=table|json|summary] [--sort=duration|memory|operation]
```

- `--format` — `table` (default), `json`, or `summary`.
- `--sort` — `duration` (default), `memory`, or `operation`.

## Code generation

### `make:file`

Generate a `Facade`, `Factory`, `Config`, `Provider`, or any combination of them.

```bash
vendor/bin/gacela make:file [-s|--short-name] <path> <filenames>...
```

- `path` — file path, e.g. `App/TestModule/TestSubModule`
- `filenames` — any combination of `facade`, `factory`, `config`, `provider`
- `-s`, `--short-name` — drop the module prefix from the generated class name

```bash
vendor/bin/gacela make:file App/TestModule facade factory provider
```

### `make:module`

Generate a full module: `Facade`, `Factory`, `Config`, and `Provider`.

```bash
vendor/bin/gacela make:module [-s|--short-name] <path>
```

```bash
vendor/bin/gacela make:module -s App/TestModule
```
