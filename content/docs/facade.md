---
title: Facade
description: Expose a small, stable public API while keeping a module’s implementation private.
---

# Facade

The [Facade](https://en.wikipedia.org/wiki/Facade_pattern) is the **entry point** of your module. It exposes what the
module can do through a clean, public API while hiding the internal classes, services, and wiring behind simple method
calls.

::: tip Why use a Facade?
Other modules, controllers, and commands never reach into your module's internals. They call the Facade, which delegates
to the [Factory](/docs/factory) to build the right objects and run the logic. This keeps your module's domain
encapsulated and easy to refactor.
:::

## Start from the caller

Write the call you want consumers to make before designing the implementation. The caller should know the Facade and
nothing behind it.

```php [app.php]
<?php

declare(strict_types=1);

use App\Comment\CommentFacade;
use Gacela\Framework\Gacela;

require __DIR__ . '/vendor/autoload.php';

Gacela::bootstrap(__DIR__);

$score = (new CommentFacade())->getSpamScore('Lorem ipsum!');

echo "Spam score: {$score}" . PHP_EOL;
```

[View the complete entry point](https://github.com/gacela-project/gacela-example/blob/main/comment-spam-score/app.php).

## Define the boundary

Turn the caller's desired operation into a Facade method. Extend `AbstractFacade` and delegate the implementation
through `getFactory()`.

```php [src/Comment/CommentFacade.php]
<?php

declare(strict_types=1);

namespace App\Comment;

use Gacela\Framework\AbstractFacade;

/**
 * @extends AbstractFacade<CommentFactory>
 */
final class CommentFacade extends AbstractFacade
{
    public function getSpamScore(string $comment): int
    {
        return $this->getFactory()
            ->createSpamChecker()
            ->getSpamScore($comment);
    }
}
```

[View the complete Facade](https://github.com/gacela-project/gacela-example/blob/main/comment-spam-score/src/Comment/CommentFacade.php).
Keep this API small: add a method because a real caller needs the capability, not because an internal service happens to
expose it.

## Accessing the Facade from controllers and commands

In your infrastructure layer (controllers, CLI commands, etc.) you often can't extend `AbstractFacade`. Use
`ServiceResolverAwareTrait` together with the `#[ServiceMap]` attribute to let Gacela resolve the Facade lazily through
the Locator singleton. No constructor injection needed.

```php
<?php

use Gacela\Framework\ServiceResolver\ServiceMap;
use Gacela\Framework\ServiceResolverAwareTrait;

#[ServiceMap(method: 'getFacade', className: RunFacade::class)]
final class TestCommand extends Command
{
    use ServiceResolverAwareTrait;

    protected function execute(InputInterface $in, OutputInterface $out): int
    {
        // getDependencies() is a method on RunFacade
        $dependencies = $this->getFacade()->getDependencies($paths);
        // ...
    }
}
```

Construct a Facade directly when your code owns the entry point, as in the Quickstart. Use `#[ServiceMap]` when another
framework creates the controller or command and constructor injection is not practical.

The full reference, including repeatable declarations, the `@method` DocBlock migration path, and resolution behavior,
is [Service Map](/docs/service-map).
