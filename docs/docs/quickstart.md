# Quickstart

**Gacela helps you to build modular applications.** Splitting your project into different modules help in terms of
maintainability and scalability.

Gacela encourages your modules to interact with each other in a unified way:

- Modules interact with each other **only** via their **Facade**
- The [**Facade**](/docs/facade) is the *entry point* of a module
- The [**Factory**](/docs/factory) manages the *intra-dependencies* of the module
- The [**Provider**](/docs/provider) resolves the *extra-dependencies* of the module
- The [**Config**](/docs/config) has access to the project's *config files*

## Installation

Install Gacela as a vendor package from [Packagist](https://packagist.org/packages/gacela-project/gacela) using
composer:

```bash
composer require gacela-project/gacela
```

## Usage

Once Gacela is installed, you're ready to get started.
This is like a "Hello, World!" example with Gacela.
First, create your first module directory:

```bash
mkdir src/Module
```

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
use Gacela\Module\Facade;

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

- The options provided by [GacelaConfig](/docs/bootstrap/#gacelaconfig) such as custom bindings, plugins, suffix names,
  project namespaces, extend services, internal event, cache system and more
- Check the full documentation for each Gacela class _(within a module context)_:
    - [Facade](/docs/facade): the *entry point*
    - [Factory](/docs/factory): manages the *intra-dependencies*
    - [Provider](/docs/provider): resolves the *extra-dependencies*
    - [Config](/docs/config): access the project's *config* key values
- Want to go crazy? Check "[Gacela in a file](/docs/extra/#gacela-in-a-file)" to see the flexibility of Gacela