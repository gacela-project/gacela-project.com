# Facade

The [Facade](https://en.wikipedia.org/wiki/Facade_pattern) is the **entry point** of your module. It exposes what the module can do through a clean, public API while hiding the internal classes, services, and wiring behind simple method calls.

::: tip Why use a Facade?
Other modules, controllers, and commands never reach into your module's internals. They call the Facade, which delegates to the [Factory](/docs/factory) to build the right objects and run the logic. This keeps your module's domain encapsulated and easy to refactor.
:::

## Defining a Facade

Extend `AbstractFacade` and use `getFactory()` to access the module's internal services.

Full code snippet: [gacela-example/comment-spam-score/facade](https://github.com/gacela-project/gacela-example/blob/main/comment-spam-score/src/Comment/CommentFacade.php)

```php
<?php # src/Comment/CommentFacade.php

namespace App\Comment;

use Gacela\Framework\AbstractFacade;

/**
 * @method CommentFactory getFactory()
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

## Using the Facade

Instantiate the Facade and call its methods. No need to know about the Factory, services, or config behind it.

Full code snippet: [gacela-example/comment-spam-score/entry-point](https://github.com/gacela-project/gacela-example/blob/main/comment-spam-score/app.php)
```php
<?php
require __DIR__ . '/vendor/autoload.php';

use App\Comment\CommentFacade;
use Gacela\Framework\Gacela;

Gacela::bootstrap(__DIR__);

$facade = new CommentFacade();
$score = $facade->getSpamScore('Lorem ipsum!');

echo sprintf('Spam Score: %d', $score) . PHP_EOL;
```

## Accessing the Facade from controllers and commands

In your infrastructure layer (controllers, CLI commands, etc.) you often can't extend `AbstractFacade`. Use `ServiceResolverAwareTrait` together with the `#[ServiceMap]` attribute to let Gacela resolve the Facade lazily through the Locator singleton. No constructor injection needed.

### Recommended: `#[ServiceMap]` attribute

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

`#[ServiceMap]` is repeatable. Declare as many resolvable services as the class needs.

### Alternative: DocBlock `@method`

Still fully supported; useful on PHP versions where attributes are awkward, or when migrating a legacy code base.

```php
<?php

use Gacela\Framework\ServiceResolverAwareTrait;

/**
 * @method RunFacade getFacade()
 */
final class TestCommand extends Command
{
    use ServiceResolverAwareTrait;

    protected function execute(InputInterface $in, OutputInterface $out): int
    {
        $dependencies = $this->getFacade()->getDependencies($paths);
        // ...
    }
}
```

::: info Migration
`DocBlockResolverAwareTrait` was renamed to `ServiceResolverAwareTrait` in `1.12.0`. The old trait name still works, but new code should use `ServiceResolverAwareTrait`.
:::

#### Why not simply instantiate the Facade?

Instantiating the Facade would be another alternative, but using `ServiceResolverAwareTrait` Gacela will use the Locator singleton to avoid duplicating the creation of the same Facade multiple times.

#### How does this work?

The `ServiceResolverAwareTrait` resolves at runtime the type from `#[ServiceMap]` (or the DocBlock `@method`), so this trait is not limited to the Facade. You can use it to lazily load any Gacela-resolvable class without constructor injection. Gacela handles the autoloading of its dependencies.