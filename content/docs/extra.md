+++
title = "Extra"
description = "Extra things you can do with Gacela"
weight = 60
+++

## Extra Modules

- [Router](https://github.com/gacela-project/router): A minimalistic HTTP router.
- [Container](https://github.com/gacela-project/container): A minimalistic container dependency.

## Templates

- [API skeleton](https://github.com/gacela-project/api-skeleton): A skeleton to build an API using Gacela.

## Examples

You can see an example of a module using Gacela in this [repository](https://github.com/gacela-project/gacela-example).

See how Gacela works with **Symfony**, **Laravel** or [other frameworks](/docs/other-frameworks/).

### Gacela in a file

With `AnonymousGlobal::addGlobal()`, you can attach a Gacela class to a context (either an object or string).
In this example, you can see how you can have a full Gacela modularity concepts in a single file by linking them to the same context; in this case the current file name.

```php
<?php declare(strict_types=1);
# file: local/gacela-in-a-file.php

require dirname(__DIR__) . '/vendor/autoload.php';

use Gacela\Framework\AbstractConfig;
use Gacela\Framework\AbstractProvider;
use Gacela\Framework\AbstractFacade;
use Gacela\Framework\AbstractFactory;
use Gacela\Framework\Bootstrap\GacelaConfig;
use Gacela\Framework\ClassResolver\GlobalInstance\AnonymousGlobal;
use Gacela\Framework\Container\Container;
use Gacela\Framework\Gacela;

Gacela::bootstrap(__DIR__);

$contextName = basename(__FILE__, '.php');

AnonymousGlobal::addGlobal(
    $contextName,
    new class() extends AbstractConfig {
        /** @return list<int> */
        public function getValues(): array
        {
            return [1, 2, 3];
        }
    }
);

AnonymousGlobal::addGlobal(
    $contextName,
    new class() extends AbstractProvider {
        public function provideModuleDependencies(Container $container): void
        {
            $container->set('my-greeter', new class() {
                public function greet(string $name): string
                {
                    return "Hello, $name!";
                }
            });
        }
    }
);

AnonymousGlobal::addGlobal(
    $contextName,
    new class() extends AbstractFactory {
        public function createDomainClass(): object
        {
            /** @var object $myService */
            $myService = $this->getProvidedDependency('my-greeter');

            /** @var list<int> $configValues */
            $configValues = $this->getConfig()->getValues();

            return new class($myService, ...$configValues) {
                private object $myService;
                /** @var int[] */
                private array $configValues;

                public function __construct(
                    object $myService,
                    int ...$configValues
                ) {
                    $this->myService = $myService;
                    $this->configValues = $configValues;
                }

                public function getConfigValues(): array
                {
                    return $this->configValues;
                }

                public function greet(string $name): string
                {
                    return $this->myService->greet($name);
                }
            };
        }
    }
);

$facade = new class() extends AbstractFacade {
    public function getSomething(): array
    {
        return $this->getFactory()
            ->createDomainClass()
            ->getConfigValues();
    }

    public function greet(string $name): string
    {
        return $this->getFactory()
            ->createDomainClass()
            ->greet($name);
    }
};

var_dump($facade->getSomething());
var_dump($facade->greet('World'));
```

Usage:

```bash
➜ php local/gacela-in-a-file.php
# from the config values [see getValues() from `new class() extends AbstractConfig`]
array:3 [
  0 => 1
  1 => 2
  2 => 3
]
# from the `my-greeter` service
"Hello, World!"
```
