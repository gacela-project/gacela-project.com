---
title: Single-file modules
description: Build a small Gacela module in one file for prototypes, scripts, and focused command-line tools.
---

# Single-file modules

Use this pattern when one directory per module adds more ceremony than clarity. For a module you expect to grow, use
the conventional layout from the [Quickstart](/docs/quickstart).

## Gacela in a file

`Gacela::addGlobal()` binds Gacela pillar classes (Facade, Factory, Provider, Config) to a shared context. Without a
context, it uses the current file. So you can wire a full module in one file with anonymous classes.

::: tip When is this useful?
Prototypes, one-off scripts, and small CLI tools, where a directory per module is overkill.
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

Two small domain classes. In a regular module they live in its `Domain/` or `Application/` directory:

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

`addGlobal()` binds each anonymous class to the same file context, so they resolve each other automatically:

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

`Gacela::addGlobal()` binds a class to a context, its second argument. Without one, the context is the current file
path. The four anonymous classes above share that file context. So the Facade resolves its Factory, and the Factory
resolves the Provider and Config, as in a regular directory-based module.

## Related resources

- [Example project](https://github.com/gacela-project/gacela-example): A complete module example
- [API skeleton](https://github.com/gacela-project/api-skeleton): A skeleton to build an API with Gacela
- [Router](https://github.com/gacela-project/router): A minimalistic HTTP router
- [Container](https://github.com/gacela-project/container): A minimalistic dependency container

See how Gacela works with **Symfony**, **Laravel**, and [other frameworks](/docs/framework-integration).
