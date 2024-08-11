+++
title = "Quickstart"
description = "Installation steps to get Gacela in your project"
weight = 0
+++

**Gacela helps you to build modular applications.** Splitting your project into different modules help in terms of
maintainability and scalability.

Gacela encourages your modules to interact with each other in a unified way:

- Modules interact with each other only via their Facade
- The Facade is the entry point of a module
- The Factory manage the intra-dependencies the module
- The DependencyProvider resolves the extra-dependencies of the module
- The Config has access to the project's config files

## Installation

Install Gacela as a vendor package from [Packagist](https://packagist.org/packages/gacela-project/gacela) using
composer:

```bash
composer require gacela-project
```

## Usage

Once Gacela is installed, you're ready to get started.

First, bootstrap Gacela from your application entry point:

```php source
# file: example.php
Gacela::bootstrap(__DIR__);
```

Create your first module:

```bash
mkdir src/Module
```

Next, create a Facade for your module:

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
The Facade has an autoresolver for the sibling Factory of the module. 
Let's create the Factory:
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

Create a directory to save your application services:

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
        return "hi, $name!";
    }
}
```

Create an executable example:
```php source
# file: example.php
use Gacela\Framework\Gacela;
use Gacela\Module\Facade;

require __DIR__ . '/../vendor/autoload.php';

Gacela::bootstrap(__DIR__);

$facade = new Facade();
echo $facade->greet('Alice');
```

## Next steps

Dive deeper into the documentation to discover the options provided by `GacelaConfig` such as custom bindings, plugins,
suffix names, project namespaces, extend services and more. 