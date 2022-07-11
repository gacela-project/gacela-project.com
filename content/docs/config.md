+++
title = "Config"
weight = 5
+++

This concept is not a design pattern itself, but it's designed in a way that you can easily access all config values in
your modules, and it's accessible from the Factory out of the box. The Config allows you to construct your business
objects with specific configuration values clearly and straightforwardly.

Note: This example will use the "Config PHP files" by default; all files in `'config/*.php'`.

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

### Config files for different environments

You can load (on top of the existing application config files) some particular files with the same suffix as
the `APP_ENV` values in the config files. For example, having this config setup:
```php
<?php
Gacela::bootstrap($appRootDir, function (GacelaConfig $config): void {
    $config->addAppConfig('config/default.php');
});
```

```php
<?php # config/default.php

return [
    'AKISMET-KEY' => 'default-akismet-key',
];
```

```php
<?php # config/default-prod.php

return [
    'AKISMET-KEY' => 'production-akismet-key',
];
```

Then the config value that we will get when looking for `'AKISMET-KEY` will be:
- If we don't have any `APP_ENV`, then `default-akismet-key`
- If we have `APP_ENV=prod`, then `production-akismet-key`