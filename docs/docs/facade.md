# Facade

The responsibility of the [Facade](https://en.wikipedia.org/wiki/Facade_pattern) is to provide a simplified interface to
hide the domain implementation.

In Gacela, the Facade is the entry point of your module. It will simply give you the methods with the possible actions
this module can do.

## Entering your module

The Facade uses the Factory to create the module's domain instances and executes the desired behaviour from them.

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

## The entry point of the module

The Facade uses the Factory to create the module's internal instances and executes the desired behaviour from them.

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

## Use the Facade from your infrastructure layer

You can access the Facade from your infrastructure layer (Controller, Command, etc.) without inheriting from it. Use the `ServiceResolverAwareTrait` together with the `#[ServiceMap]` attribute — or, as an alternative, the older DocBlock `@method` form — to let Gacela resolve the Facade lazily through the Locator singleton.

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

`#[ServiceMap]` is repeatable — declare as many resolvable services as the class needs.

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

The `ServiceResolverAwareTrait` resolves on runtime the type from `#[ServiceMap]` (or the DocBlock `@method`), so this trait is not limited to the Facade — you can use it to lazily load any Gacela-resolvable class without the need of injecting it via the constructor. Gacela will do the rest of the autoloading of its dependencies.