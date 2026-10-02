---
title: Facade
description: Expose a small, stable public API while keeping a module’s implementation private.
---

# Facade

The [Facade](https://en.wikipedia.org/wiki/Facade_pattern) is the **entry point** of your module. Its public methods
expose what the module can do and hide the internal classes, services and wiring.

::: tip Why use a Facade?
Other modules, controllers and commands never reach into your module's internals. They call the Facade, which asks the
[Factory](/docs/factory) to build the objects that run the logic. Your module's domain stays encapsulated and easy to
refactor.
:::

## Start from the caller

Write the call you want consumers to make before you design the implementation. The caller knows the Facade and
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

Turn the caller's operation into a Facade method. Extend `AbstractFacade` and delegate the work through
`getFactory()`.

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
Keep this API small. Add a method because a real caller needs it, not because an internal service exposes it.

## Accessing the Facade from controllers and commands

In your infrastructure layer (controllers, CLI commands, etc.) you often can't extend `AbstractFacade`. Combine
`ServiceResolverAwareTrait` with the `#[ServiceMap]` attribute, and Gacela resolves the Facade lazily through the
Locator singleton. You need no constructor injection.

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

[Service Map](/docs/service-map) is the full reference: repeatable declarations, the `@method` DocBlock migration path,
and resolution behavior.
