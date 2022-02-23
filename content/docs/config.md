+++
title = "Config"
weight = 5
+++

This concept is not a design pattern itself, but it's designed in a way that you can easily access all config values in
your modules, and it's accessible from the Factory out of the box. The Config allows you to construct your business
objects with specific configuration values clearly and straightforwardly.

Note: This example will use the "Config PHP files" by default. This is all files in `'config/*.php'`.

### The config file

First, we need a config file with the key-values that we want to access from out `Config`:
```php
<?php # config/default.php

return [
    'AKISMET-KEY' => 'your-akismet-key',
];
```

### The Module's Config class

The `Config` class from your module can access those config key-values by their keys:
```php
<?php # src/Comment/CommentConfig.php

use Gacela\Framework\AbstractConfig;

final class CommentConfig extends AbstractConfig
{
    public function getSpamCheckerEndpoint(): string 
    {
        return sprintf(
            'https://%s.rest.akismet.com/1.1/comment-check', 
            $this->get('AKISMET-KEY')
        );
    }
} 
```

### Accessing the Config from the Factory

You can access the `Config` methods from the `Factory`, to create your domain logic:
```php
<?php # src/Comment/CommentFactory.php

use Gacela\Framework\AbstractFactory;

/**
 * @method CommentConfig getConfig()
 */
final class CommentFactory extends AbstractFactory
{
    public function createSpamChecker(): SpamChecker
    {
        return new SpamChecker(
            HttpClient::create(),
            $this->getConfig()->getSpamCheckerEndpoint()
        );
    }    
}
```

### The Facade uses the Factory

In the end, the Factory will be used by the module's Facade:

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
