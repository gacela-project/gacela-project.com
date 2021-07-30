+++
title = "Facade"
template = "section.html"
+++

# Facade

The responsibility of the Facade is to provide a simplified interface to hide the domain implementation.

In Gacela, the Facade is the entry point of your module. It will simply give you the methods with the possible actions
this module can do.

## Entering your module

The Facade uses the Factory to create the module's domain instances and executes the desired behaviour from them.

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

A Facade is a "ready to use" thing:

```php
<?php declare(strict_types=1);

use App\Comment\CommentFacade;

$facade = new CommentFacade();
$score = $facade->getSpamScore('Lorem ipsum!');
var_dump($score);
```

The Facade uses the Factory to create the module's domain instances and executes the desired behaviour from them.
