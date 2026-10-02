---
title: Quickstart
description: Install Gacela 2.6 and build a working module in a few minutes.
---

# Quickstart

Gacela gives each PHP module a clear public boundary and leaves your domain model alone. In this guide you build a
complete module and run it from the command line.

**You build:** one entry point you can run, one public module boundary, and one service with no Gacela code in it.

**You need:** PHP 8.3 or newer and [Composer](https://getcomposer.org/).

## Installation

Gacela 2.6 requires **PHP 8.3 or newer**. Install it from [Packagist](https://packagist.org/packages/gacela-project/gacela):

```bash
composer require gacela-project/gacela:^2.6
```

## Start with the code you want to run

Write the caller first. It defines the only method the module has to expose: `greet()`.

```php [example.php]
<?php

declare(strict_types=1);

use Gacela\Framework\Gacela;
use Module\Facade;

require __DIR__ . '/vendor/autoload.php';

Gacela::bootstrap(__DIR__);

$facade = new Facade();

echo $facade->greet('Alice');
```

The call will flow like this:

```text
example.php → Facade → Factory → Greeter
```

Create the directories for these classes:

```bash
mkdir -p src/Module/Service
```

## 1. Expose the module through a Facade

The [Facade](/docs/facade) is the module's public API. It holds no business logic: it passes the request on.

```php [src/Module/Facade.php]
<?php

declare(strict_types=1);

namespace Module;

use Gacela\Framework\AbstractFacade;

/**
 * @extends AbstractFacade<Factory>
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

When you call `getFactory()`, Gacela resolves the `Factory` in the same namespace.

## 2. Construct the service in a Factory

The [Factory](/docs/factory) builds the module's objects. Construction details stay out of the Facade and the
service.

```php [src/Module/Factory.php]
<?php

declare(strict_types=1);

namespace Module;

use Gacela\Framework\AbstractFactory;
use Module\Service\Greeter;

final class Factory extends AbstractFactory
{
    public function createGreeter(): Greeter
    {
        return new Greeter();
    }
}
```

## 3. Add the application service

`Greeter` is plain PHP. It extends and imports nothing from Gacela.

```php [src/Module/Service/Greeter.php]
<?php

declare(strict_types=1);

namespace Module\Service;

final class Greeter
{
    public function greet(string $name): string
    {
        return "Hi, {$name}!";
    }
}
```

## 4. Run it

Map the `Module\\` namespace to `src/Module/` in Composer:

```json [composer.json]
{
  "autoload": {
    "psr-4": {
      "Module\\": "src/Module/"
    }
  }
}
```

Rebuild the autoloader and run the entry point:

```bash
composer dump-autoload
php example.php
```

```text
Hi, Alice!
```

That output proves the whole path works: Composer loaded the classes, Gacela found the module's Factory, and the
Facade reached the service.

### If it does not run

| Error                              | Check                                                                                                              |
|------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| `Class "Module\\Facade" not found` | Confirm the PSR-4 mapping, then run `composer dump-autoload` again                                                 |
| Gacela cannot resolve `Factory`    | Confirm `Factory.php` is beside `Facade.php`, both use `namespace Module`, and the class name is exactly `Factory` |
| `vendor/autoload.php` is missing   | Run `composer install` from the project root                                                                       |
| Your PHP version is rejected       | Run `php -v`; Gacela 2.6 requires PHP 8.3+                                                                         |

You now have a complete Gacela module. Add a [Provider](/docs/provider) only when it needs another module or an
infrastructure service. Add a [Config](/docs/config) only when it needs application settings.

::: tip Optional CLI setup
To use the optional CLI, install `symfony/console` 7 or 8 and run `vendor/bin/gacela init` to scaffold `gacela.php`.
This example does not need that file.
:::

## Next steps

Pick the page for what your module needs next:

- [Getting dependencies](/docs/getting-dependencies): choose the right wiring mechanism
- [Provider](/docs/provider): talk to another module through its Facade
- [Config](/docs/config): expose application settings through typed getters
- [Bindings and container services](/docs/bindings): set application-wide dependency rules
- [Testing](/docs/testing): bootstrap Gacela with isolated state in PHPUnit
