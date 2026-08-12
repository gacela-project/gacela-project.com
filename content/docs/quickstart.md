---
title: Quickstart
description: Install Gacela 2.2 and build a complete, working module in a few minutes.
---

# Quickstart

Gacela gives PHP modules a predictable public boundary without imposing rules on your domain model. This guide creates a
complete module you can run from the command line.

**You will build:** one runnable entry point, one public module boundary, and one framework-independent service.

**Before you start:** use PHP 8.3 or newer and have [Composer](https://getcomposer.org/) available.

## Installation

Gacela 2.2 requires **PHP 8.3 or newer**. Install it
from [Packagist](https://packagist.org/packages/gacela-project/gacela):

```bash
composer require gacela-project/gacela:^2.2
```

## Start with the code you want to run

Write the caller first. It defines the only API this module needs to expose: `greet()`.

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

The flow behind that call will be:

```text
example.php → Facade → Factory → Greeter
```

Create the directories for those classes:

```bash
mkdir -p src/Module/Service
```

## 1. Expose the module through a Facade

The [Facade](/docs/facade) is the module's public API. It delegates the request instead of containing business logic.

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

Gacela resolves the sibling `Factory` automatically when `getFactory()` is called.

## 2. Construct the service in a Factory

The [Factory](/docs/factory) owns object construction inside the module. This keeps construction details out of the
Facade and the service itself.

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

`Greeter` is ordinary PHP. It does not extend or import anything from Gacela.

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

Make sure Composer maps the `Module\\` namespace to `src/Module/`:

```json [composer.json]
{
  "autoload": {
    "psr-4": {
      "Module\\": "src/Module/"
    }
  }
}
```

Then rebuild the autoloader and run the entry point:

```bash
composer dump-autoload
php example.php
```

```text
Hi, Alice!
```

If you see that output, the complete resolution path works: Composer loaded the classes, Gacela found the module's
Factory, and the Facade reached the service.

### If it does not run

| Error                              | Check                                                                                                              |
|------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| `Class "Module\\Facade" not found` | Confirm the PSR-4 mapping, then run `composer dump-autoload` again                                                 |
| Gacela cannot resolve `Factory`    | Confirm `Factory.php` is beside `Facade.php`, both use `namespace Module`, and the class name is exactly `Factory` |
| `vendor/autoload.php` is missing   | Run `composer install` from the project root                                                                       |
| Your PHP version is rejected       | Run `php -v`; Gacela 2.2 requires PHP 8.3+                                                                         |

That is a complete Gacela module. Add a [Provider](/docs/provider) only when it needs another module or infrastructure
service, and add a [Config](/docs/config) only when it needs application settings.

::: tip Optional CLI setup
Applications using the optional CLI can install `symfony/console` 7 or 8 and run `vendor/bin/gacela init` to scaffold
`gacela.php`. This example does not need that file.
:::

## Next steps

Continue according to what the module needs next:

- [Getting dependencies](/docs/getting-dependencies) — choose the right wiring mechanism
- [Provider](/docs/provider) — communicate with another module through its Facade
- [Config](/docs/config) — expose application settings through typed getters
- [Bindings and container services](/docs/bindings) — configure application-wide dependency policies
- [Testing](/docs/testing) — bootstrap Gacela with isolated state in PHPUnit
