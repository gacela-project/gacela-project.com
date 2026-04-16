# Advanced Patterns

## Gacela in a file

`Gacela::addGlobal()` lets you bind Gacela pillar classes (Facade, Factory, Provider, Config) to a shared context. When no context is passed, the current file is used. This means you can wire a full module in a single file using anonymous classes.

::: tip When is this useful?
Prototyping, one-off scripts, or small CLI tools where a full directory-per-module structure would be overkill.
:::

### 1. Bootstrap and domain classes

```php
<?php declare(strict_types=1);
# file: local/gacela-in-a-file.php

require __DIR__ . '/../vendor/autoload.php';

use Gacela\Framework\AbstractConfig;
use Gacela\Framework\AbstractFacade;
use Gacela\Framework\AbstractFactory;
use Gacela\Framework\AbstractProvider;
use Gacela\Framework\Bootstrap\GacelaConfig;
use Gacela\Framework\Container\Container;
use Gacela\Framework\Gacela;

Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
    $config->addAppConfigKeyValue('default-name', 'Gacela');
});
```

Two simple domain classes (these would normally live in your module's `Domain/` or `Application/` directory):

```php
final class Printer
{
    public function print(string $str): void
    {
        echo $str;
    }
}

final class Greeter
{
    public function __construct(
        private readonly Printer $printer,
        private readonly string $defaultName,
    ) {}

    public function greet(string $name): void
    {
        if ($name === '') {
            $name = $this->defaultName;
        }
        $this->printer->print("Hello, {$name}!\n");
    }
}
```

### 2. Wire the Gacela pillars as anonymous classes

Each anonymous class is bound to the same file context via `addGlobal()`, so they auto-resolve each other:

```php
// Facade: the entry point
$facade = new class() extends AbstractFacade {
    public function greet(string $name): void
    {
        $this->getFactory()
            ->createGreeter()
            ->greet($name);
    }
};

// Factory: creates internal objects, pulls config and provided deps
Gacela::addGlobal(
    new class() extends AbstractFactory {
        public function createGreeter(): Greeter
        {
            return new Greeter(
                $this->getProvidedDependency('printer'),
                $this->getConfig()->getDefaultName(),
            );
        }
    },
);

// Provider: defines cross-module / external dependencies
Gacela::addGlobal(
    new class() extends AbstractProvider {
        public function provideModuleDependencies(Container $container): void
        {
            $container->set('printer', static fn () => new Printer());
        }
    },
);

// Config: reads from config files
Gacela::addGlobal(
    new class() extends AbstractConfig {
        public function getDefaultName(): string
        {
            return $this->get('default-name');
        }
    },
);
```

### 3. Use the Facade

```php
$facade->greet('World');  // Hello, World!
$facade->greet('');       // Hello, Gacela!
```

```bash
php local/gacela-in-a-file.php

Hello, World!
Hello, Gacela!
```

### How `addGlobal()` works

`Gacela::addGlobal()` binds a class to a context (2nd argument). When omitted, the current file path is used as the context. Because all four anonymous classes above share the same file context, the Facade automatically resolves its Factory, the Factory resolves the Provider and Config, just like a regular directory-based module.

## Related resources

- [Example project](https://github.com/gacela-project/gacela-example): A complete module example
- [API skeleton](https://github.com/gacela-project/api-skeleton): A skeleton to build an API using Gacela
- [Router](https://github.com/gacela-project/router): A minimalistic HTTP router
- [Container](https://github.com/gacela-project/container): A minimalistic dependency container

See how Gacela works with **Symfony**, **Laravel** or [other frameworks](/docs/other-frameworks/).
