---
title: Quickstart
description: Install Gacela 2.0 and build a complete, working module in a few minutes.
---

# Quickstart

Gacela gives PHP modules a predictable public boundary without imposing rules on your domain model. This guide creates a complete module you can run from the command line.

Gacela encourages your modules to interact with each other in a unified way:

- Modules interact with each other **only** via their **Facade**
- The [**Facade**](/docs/facade) is the *entry point* of a module
- The [**Factory**](/docs/factory) creates and wires services inside the module
- The [**Provider**](/docs/provider) resolves dependencies from other modules or infrastructure
- The [**Config**](/docs/config) exposes application settings through typed getters

## Installation

Gacela 2.0 requires **PHP 8.3 or newer**. Install it from [Packagist](https://packagist.org/packages/gacela-project/gacela):

```bash
composer require gacela-project/gacela:^2.0
```

## Usage

Create your first module directory:

```bash
mkdir src/Module
```

For projects that use the optional CLI (`symfony/console` 7 or 8), `vendor/bin/gacela init` also scaffolds a `gacela.php` configuration file. This minimal example does not need one.

Next, create a [Facade](/docs/facade) for your module:

```php source
# file: src/Module/Facade.php
namespace Module;

use Gacela\Framework\AbstractFacade;

/**
 * @method Factory getFactory()
 */
final class Facade extends AbstractFacade
{
    public function greet(string $name): string
    {
        return $this->getFactory()
            ->createGreeter()
            ->greet($name);
    }
}
```
The [Facade](/docs/facade) has an auto-resolver for the sibling [Factory](/docs/factory) of the module.
Let's create it:
```php source
# file: src/Module/Factory.php
namespace Module;

use Gacela\Framework\AbstractFactory;
use Module\Service\Greeter;

final class Factory extends AbstractFactory
{
    public function createGreeter(): Greeter
    {
        return new Greeter(
            // ... dependencies
        );
    }
}
```

Create the application service that will be instantiated in the [Factory](/docs/factory):

```bash
mkdir src/Module/Service
```

```php source
# file: src/Module/Service/Greeter.php
namespace Module\Service;

final class Greeter
{
    public function __construct(
        // ... dependencies
    ) {}

    public function greet(string $name): string
    {
        return "Hi, $name!";
    }
}
```

Finally, create an entry point, where you can instantiate the [Facade](/docs/facade) and use it.
```php source
# file: example.php
use Gacela\Framework\Gacela;
use Module\Facade;

require __DIR__ . '/vendor/autoload.php';

# Gacela must be bootstrapped on the entry point of your application
Gacela::bootstrap(__DIR__);

$facade = new Facade();
echo $facade->greet('Alice'); # Hi, Alice!
```

Additionally, the [Factory](/docs/factory) can access the [Config](/docs/config) and
the [Provider](/docs/provider) classes of the module which provides a lot of
potential for configuration and extension. I didn't add them in this example to keep it simple.

## Next steps

Dive deeper into the [documentation](/docs/bootstrap) to discover:

- [Bindings](/docs/bindings): dependency injection, factory services, aliases, contextual bindings
- [Getting dependencies](/docs/getting-dependencies): the recommended path for each dependency type
- [Upgrade to 2.0](/docs/upgrading): breaking changes and mechanical migrations from 1.21
- [Extensions & Plugins](/docs/extensions): plugins, extendService, handler registry
- [Module Customization](/docs/customization): suffix types, project namespaces, events
- Each core concept in detail:
    - [Facade](/docs/facade): the *entry point*
    - [Factory](/docs/factory): creates and wires internal services
    - [Provider](/docs/provider): supplies cross-module dependencies
    - [Config](/docs/config): access the project's *config* key values
- Want to go crazy? Check "[Gacela in a file](/docs/extra#gacela-in-a-file)" to see the flexibility of Gacela
