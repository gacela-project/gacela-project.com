# Config

The Config gives your module access to **key-value configuration** from your project's config files. It's accessible from the [Factory](/docs/factory) out of the box, so you can pass config values directly into your domain objects at creation time.

::: info
The examples below use PHP config files by default (`config/*.php`). See [Bootstrap > Application Config](/docs/bootstrap#application-config) for other formats and custom readers.
:::

## The config file

First, create a config file with the key-values that you want to access from your module's `Config`:
```php
<?php # config/default.php

return [
    'AKISMET-KEY' => 'your-akismet-key',
];
```

## The Module's Config class

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

## Accessing the Config from the Factory

You can access the `Config` methods from the `Factory` to create your domain objects with the right configuration:
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

## The Facade uses the Factory

The Factory is used by the module's Facade, completing the chain: **Facade → Factory → Config**:

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

## Config files for different environments

You can load environment-specific config files on top of the defaults. Gacela looks for files with the same suffix as the `APP_ENV` value. For example:
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

The resolved value for `'AKISMET-KEY'` depends on the environment:
- No `APP_ENV` set → `default-akismet-key`
- `APP_ENV=prod` → `production-akismet-key` (overrides the default)