+++
title = "Quickstart"
description = "Installation steps to get Gacela in your project"
weight = 0
+++

**Gacela helps you to build modular applications.** Splitting your project into different modules help in terms of
maintainability and scalability.

Gacela encourages your modules to interact with each other in a unified way:

- Modules interact with each other **only** via their **Facade**
- The [**Facade**](/docs/facade) is the *entry point* of a module
- The [**Factory**](/docs/factory) manages the *intra-dependencies* of the module
- The [**DependencyProvider**](/docs/dependency-provider) resolves the *extra-dependencies* of the module
- The [**Config**](/docs/config) has access to the project's *config files*

## Installation

Install Gacela as a vendor package from [Packagist](https://packagist.org/packages/gacela-project/gacela) using
composer:

<div id="installation-composer">
    <pre class="z-code"><code><span class="z-variable z-function z-shell">composer</span> <span class="z-meta z-function-call z-arguments z-shell">require gacela-project/gacela</span></code></pre>
    <span class="button-copy-code-snippet tooltip" onclick="document.execCommand('copy')">
        <span class="tooltip-text">Copied!</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" data-view-component="true" height="24" width="24">
            <path fill-rule="evenodd" d="M5.75 1a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-4.5zm.75 3V2.5h3V4h-3zm-2.874-.467a.75.75 0 00-.752-1.298A1.75 1.75 0 002 3.75v9.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-9.5a1.75 1.75 0 00-.874-1.515.75.75 0 10-.752 1.298.25.25 0 01.126.217v9.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-9.5a.25.25 0 01.126-.217z"></path>
        </svg>
    </span>
</div>

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
the [DependencyProvider](/docs/dependency-provider) classes of the module which provides a lot of
potential for configuration and extension. I didn't add them in this example to keep it simple.

## Next steps

Dive deeper into the [documentation](/docs/bootstrap) to discover:

- The options provided by [GacelaConfig](/docs/bootstrap/#gacelaconfig) such as custom bindings, plugins, suffix names,
  project namespaces, extend services, internal event, cache system and more.
- Check the full documentation for each Gacela class _(within a module context)_: 
  - [Facade](/docs/facade): the *entry point*
  - [Factory](/docs/factory): manages the *intra-dependencies*
  - [DependencyProvider](/docs/dependency-provider): resolves the *extra-dependencies*
  - [Config](/docs/config): access the project's *config* key values
- Want to go crazy? Check "[Gacela in a file](/docs/extra/#gacela-in-a-file)" to see the flexibility of Gacela.