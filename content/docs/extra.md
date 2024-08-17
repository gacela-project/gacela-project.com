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

require __DIR__ . '/../vendor/autoload.php';

use Gacela\Framework\AbstractConfig;
use Gacela\Framework\AbstractFacade;
use Gacela\Framework\AbstractFactory;
use Gacela\Framework\AbstractProvider;
use Gacela\Framework\Bootstrap\GacelaConfig;
use Gacela\Framework\Container\Container;
use Gacela\Framework\Gacela;

Gacela::bootstrap(__DIR__,function (GacelaConfig $config){
    // this can be read from a config file
    $config->addAppConfigKeyValue('default-name', 'Gacela'); 
});

/** This is an example class from your @infrastructure layer */
final class Printer
{
    public function print(string $str): void
    {
        echo $str;
    }
}

/**This is an example class from your @application layer */
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

##########################################################
# The Gacela classes example of a module all-in-one file #
##########################################################
$facade = new class() extends AbstractFacade {
    public function greet(string $name): void
    {
        $this->getFactory()   // the Facade uses the Factory
            ->createGreeter() // to create
            ->greet($name);   // and use the object directly
    }
};

Gacela::addGlobal(
    new class() extends AbstractFactory {
        public function createGreeter(): object
        {
            // the Factory creates the internal dependencies
            // has access to external dependencies
            // and has access to the config values
            return new Greeter( 
                $this->getProvidedDependency('printer'), 
                $this->getConfig()->getDefaultName(), 
            );
        }
    },
);

Gacela::addGlobal(
    new class() extends AbstractProvider {
        public function provideModuleDependencies(Container $container): void
        {
            // the Provider defines the extra dependencies of the "module"
            $container->set('printer', static fn () => new Printer());
        }
    },
);

Gacela::addGlobal(
    new class() extends AbstractConfig {
        public function getDefaultName(): string
        {
            // the Config can access the config files
            return $this->get('default-name');
        }
    },
);

$facade->greet('World');
$facade->greet('');
```

Usage:

```bash
➜ php local/gacela-in-a-file.php

Hello, World!
Hello, Gacela!

# Explanation: Gacela::addGlobal() will create a class binding to a context, 
# if none is passed (2nd argument) then the current file will be used. 
# This means that the anonymous Facade will have the Factory, Provider and Config
# connected to it because they are all bind to the same file.
```
