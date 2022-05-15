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
the need of inheritance. You just need to use the trait: `DocBlockResolverAwareTrait` and define the `getFacade()` method 
in the DocBlock pointing to the concrete Facade.

A usage example:
```php
<?php
/**
 * @method RunFacade getFacade()
 */
final class TestCommand extends Command
{
    use DocBlockResolverAwareTrait;
    
    protected function configure(): void
    {
        $this->setName('test');
    }

    protected function execute(InputInterface $in, OutputInterface $out): int
    {
        $dependencies = $this->getFacade()->getDependencies($paths);
        // ...
    }
}
```

#### Why not simply instantiate the Facade?

Instantiating the Facade would be another alternative, but using `DocBlockResolverAwareTrait` Gacela will use the 
Locator singleton to avoid duplicating the creation of the same Facade multiple times.

#### How do this works?

Basically, the `DocBlockResolverAwareTrait` resolves on runtime the type from that method, so this trait is not limited 
to the Facade, but to any infrastructure class that you might want to load on the fly without the need of injecting via
the constructor. Apart from this, Gacela will do the rest of the autoloading of its possible dependencies.  