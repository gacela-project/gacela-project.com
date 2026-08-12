---
title: Factory
description: Create a module’s internal services and wire configuration and provided dependencies into them.
---

# Factory

The [Factory](https://en.wikipedia.org/wiki/Factory_(object-oriented_programming)) is responsible for **creating the
internal objects** of your module and wiring their dependencies, pulling values from [Config](/docs/config) and services
from the [Provider](/docs/provider).

::: tip Key points
- The Factory creates and assembles the classes inside your module
- Only the [Facade](/docs/facade) accesses the Factory (via `getFactory()`)
- Dependencies from other modules come through the [Provider](/docs/provider), not the Factory
:::

## Start from the object you need

After a Facade delegates an operation, design the application or domain service that will fulfill it. Its constructor
makes the required collaborators explicit:

```php [src/Comment/Domain/SpamChecker.php]
<?php

declare(strict_types=1);

namespace App\Comment\Domain;

use Symfony\Contracts\HttpClient\HttpClientInterface;

final class SpamChecker
{
    public function __construct(
        private HttpClientInterface $client,
        private string $endpoint,
    ) {}

    public function getSpamScore(string $comment): int
    {
        // Business logic using $this->client and $this->endpoint.
        return 0;
    }
}
```

## Construct it in the Factory

Now make the Factory satisfy that constructor. Configuration and wiring stay here instead of leaking into the service or
Facade.

```php [src/Comment/CommentFactory.php]
<?php

declare(strict_types=1);

namespace App\Comment;

use App\Comment\Domain\SpamChecker;
use Gacela\Framework\AbstractFactory;
use Symfony\Contracts\HttpClient\HttpClient;

/**
 * @extends AbstractFactory<CommentConfig>
 */
final class CommentFactory extends AbstractFactory
{
    public function createSpamChecker(): SpamChecker
    {
        return new SpamChecker(
            HttpClient::create(),
            $this->getConfig()->getSpamCheckerEndpoint(),
        );
    }
}
```

[View the complete Factory](https://github.com/gacela-project/gacela-example/blob/main/comment-spam-score/src/Comment/CommentFactory.php).

## Auto-wiring dependencies into the Factory

Gacela auto-wires Factory constructor dependencies. Concrete classes are instantiated automatically (recursively
resolving their own dependencies). For interfaces, you need to tell Gacela which implementation to use by defining
a [binding](/docs/bindings):

```php
<?php # gacela.php

return function (GacelaConfig $config) {
    // Class binding: Gacela instantiates Concrete (and auto-wires its deps)
    $config->addBinding(InterfaceToConcrete::class, Concrete::class);

    // Callable binding: lazy-loaded, you control the instantiation
    $config->addBinding(InterfaceToCallable::class, fn() => new Concrete());
};
```

The difference between these two styles:

- **Class binding** (`Concrete::class`): Gacela creates a new instance on the fly, auto-wiring its constructor
  dependencies recursively
- **Callable binding** (`fn() => ...`): You control instantiation. The closure is lazy-loaded, it only runs when the
  dependency is needed

Real
example: [symfony-gacela-example/gacela.php](https://github.com/gacela-project/symfony-gacela-example/blob/main/gacela.php#L16)

For a per-parameter alternative to constructor auto-wiring, see the [`#[Inject]` attribute](/docs/inject). When a
parameter could be satisfied more than one way, the container follows a fixed
[resolution order](/docs/bindings#resolution-order).

## Sharing a single instance

Plain `create...()` methods build a fresh object on every call. When a dependency should instead be built once and
reused, use `singleton()`:

```php
protected function singleton(string $key, callable $creator): mixed;
```

It memoises the result of `$creator` under `$key` and returns the **same instance** on every later call within the
module. The creator is lazy — it only runs on first access.

```php
<?php # src/Comment/CommentFactory.php

final class CommentFactory extends AbstractFactory
{
    public function createSpamChecker(): SpamChecker
    {
        return $this->singleton(
            SpamChecker::class,
            fn (): SpamChecker => new SpamChecker(
                HttpClient::create(),
                $this->getConfig()->getSpamCheckerEndpoint(),
            ),
        );
    }
}
```

::: tip Key points
- `create...()` methods build a new instance every call; `singleton()` builds once and reuses it
- `singleton()` is generic (`@template T`, `@return T`), so its inferred return type matches `$creator` without a cast
:::
