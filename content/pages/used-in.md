---
title: Used in production
description: Explore real Gacela architecture and code from the Phel language project.
---

# Gacela in production: Phel

<p>
  <a href="https://phel-lang.org/" target="_blank" rel="noreferrer" aria-label="Phel Lang (opens in a new tab)">
    <svg width="150" height="128" viewBox="0 0 200 170" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true">
      <path d="M6 66l95 96h36V93l-36-74H42L6 56v106h36l24-35"/>
      <path d="M137 93l58-3-12-58-32-26h-34l-16 13-23 9-12 22 46 52z"/>
      <path d="M195 90l-12 57h-13l-2-56m2 56l-13-11h12"/>
    </svg>
  </a>
</p>

[Phel](https://phel-lang.org/) is a functional language that compiles to PHP. Its compiler, CLI, formatter, language server, REPL, filesystem, and tooling are organized as Gacela modules in one actively maintained codebase.

::: info Version transparency
Phel currently declares `gacela-project/gacela:^1.21`. The architecture below is real and remains representative through Gacela 2.1, but the project has not yet published a 2.x migration. Each excerpt was verified against [Phel commit `f173cf5`](https://github.com/phel-lang/phel-lang/tree/f173cf522d1b492cf12fb5404fa56c6b4bd454a4).
:::

<div class="stat-row">
  <div class="stat-row__stat"><strong>17+</strong><span>application modules</span></div>
  <div class="stat-row__stat"><strong>PHP 8.4</strong><span>declared platform</span></div>
  <div class="stat-row__stat"><strong>MIT</strong><span>open-source license</span></div>
</div>

## Why Gacela fits Phel

Phel has many subsystems but needs one coherent application. Gacela gives each subsystem a recognizable public boundary and makes cross-module dependencies explicit:

- Callers enter through a Facade instead of depending on compiler internals.
- Factories construct application and domain services inside their module.
- Providers translate concrete Facades into the interfaces another module expects.
- Framework-created Symfony commands can still resolve typed Gacela services.
- Module health checks can be collected into operational diagnostics.

## Real code walkthrough

The excerpts are shortened only where unrelated methods would obscure the pattern. Follow **Source** below each tab group for the complete production files.

::: code-group

```php [Bootstrap]
use Gacela\Framework\Gacela;
use Phel\Run\RunFacade;

public static function bootstrap(string $projectRootDir): void
{
    Gacela::bootstrap(
        $projectRootDir,
        self::configFn(self::readAppModulePaths($configPath)),
    );
}

public static function run(string $projectRootDir, string $namespace): void
{
    self::bootstrap($projectRootDir);
    (new RunFacade())->runNamespace($namespace);
}
```

```php [Facade]
final class RunFacade extends AbstractFacade implements RunFacadeInterface
{
    public function runNamespace(string $namespace): void
    {
        $this->getFactory()
            ->createNamespaceRunner()
            ->run($namespace);
    }

    public function getNamespaceFromFile(string $path): NamespaceInformation
    {
        return $this->getFactory()
            ->getBuildFacade()
            ->getNamespaceFromFile($path);
    }
}
```

```php [Provider]
final class RunProvider extends AbstractProvider
{
    #[Provides(BuildFacadeInterface::class)]
    public function buildFacade(Container $container): BuildFacadeInterface
    {
        return $container->getLocator()->getRequired(BuildFacade::class);
    }

    #[Provides(FilesystemFacadeInterface::class)]
    public function filesystemFacade(Container $container): FilesystemFacadeInterface
    {
        return $container->getLocator()->getRequired(FilesystemFacade::class);
    }
}
```

```php [Symfony command]
#[ServiceMap(method: 'getFacade', className: RunFacade::class)]
#[ServiceMap(method: 'getFactory', className: RunFactory::class)]
final class CompileCommand extends Command
{
    use ServiceResolverAwareTrait;

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->getFacade()->loadPhelNamespaces();

        $ok = $this->getFactory()
            ->createCompileExecutor()
            ->execute($source, $writeOutput, $writeError);

        return $ok ? self::SUCCESS : self::FAILURE;
    }
}
```

```php [Health check]
final readonly class BuildHealthCheck implements ModuleHealthCheckInterface
{
    public function checkHealth(): HealthStatus
    {
        if (is_dir($this->cacheDir) && !is_writable($this->cacheDir)) {
            return HealthStatus::unhealthy(
                sprintf('Cache dir not writable: %s', $this->cacheDir),
                ['path' => $this->cacheDir],
            );
        }

        return HealthStatus::healthy('Build directories are ready');
    }
}
```

:::

**Sources:** [bootstrap](https://github.com/phel-lang/phel-lang/blob/f173cf522d1b492cf12fb5404fa56c6b4bd454a4/src/php/Phel.php), [RunFacade](https://github.com/phel-lang/phel-lang/blob/f173cf522d1b492cf12fb5404fa56c6b4bd454a4/src/php/Run/RunFacade.php), [RunProvider](https://github.com/phel-lang/phel-lang/blob/f173cf522d1b492cf12fb5404fa56c6b4bd454a4/src/php/Run/RunProvider.php), [CompileCommand](https://github.com/phel-lang/phel-lang/blob/f173cf522d1b492cf12fb5404fa56c6b4bd454a4/src/php/Run/Infrastructure/Command/CompileCommand.php), and [BuildHealthCheck](https://github.com/phel-lang/phel-lang/blob/f173cf522d1b492cf12fb5404fa56c6b4bd454a4/src/php/Build/Application/BuildHealthCheck.php).

## What to copy into your project

The useful pattern is the direction of dependencies, not Phel's exact filenames:

```text
entry point → Facade → Factory → application/domain service
                         ↓
                     Provider → another module's Facade interface
```

Start a new module with the [Quickstart](/docs/quickstart), then use [Getting dependencies](/docs/getting-dependencies) when it needs to communicate with another boundary.

## Explore Phel

- [Phel website](https://phel-lang.org/)
- [Source repository](https://github.com/phel-lang/phel-lang)
- [Phel on Packagist](https://packagist.org/packages/phel-lang/phel-lang)
