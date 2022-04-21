+++
title = "Facade"
weight = 3
+++

The responsibility of the [Facade](https://en.wikipedia.org/wiki/Facade_pattern) is to provide a simplified interface to
hide the domain implementation.

In Gacela, the Facade is the entry point of your module. It will simply give you the methods with the possible actions
this module can do.

## Entering your module

The Facade uses the Factory to create the module's domain instances and executes the desired behaviour from them.

Full code snippet: [gacela-example/comment-spam-score/facade](https://github.com/gacela-project/gacela-example/blob/master/comment-spam-score/src/Comment/CommentFacade.php)

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

## A ready to use thing

The Facade uses the Factory to create the module's domain instances and executes the desired behaviour from them.

Full code snippet: [gacela-example/comment-spam-score/entry-point](https://github.com/gacela-project/gacela-example/blob/master/comment-spam-score/app.php)
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

You can easily access the Facade of your module from your infrastructure layer, like a Controller or a Command without
the need of inheritance. You just need to use the trait: `FacadeResolverAwareTrait`.

A usage example:
```php
<?php
/**
 * @method RunFacade getFacade()
 */
final class TestCommand extends Command
{
    use FacadeResolverAwareTrait;
    
    protected function configure(): void
    {
        $this->setName(self::COMMAND_NAME);
    }
    
    protected function execute(InputInterface $in, OutputInterface $out): int
    {
        $namespacesInformation = $this->getFacade()->getDependencies($paths);
        // etc ...
    }

    protected function facadeClass(): string // This is the key!
    {
        return RunFacade::class;
    }
}
```

#### Why not simply instantiate the Facade?

Instantiating the Facade would be another alternative, but doing it this way Gacela will use the Locator singleton to avoid
duplicating the creation of the same facade multiple times.

#### How does this works?

Basically, the `FacadeResolverAwareTrait` forces to implement the method `facadeClass(): string` in which you have
to explicitly define the Facade class name of the current module. This is the faster way to identify the module
starting point, and Gacela will do the rest (of the autoloading of its Factory and other classes).  