---
title: Config
description: Read typed application configuration inside a module without coupling domain code to files or environment variables.
---

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

## Typed config accessors

`AbstractConfig` also provides typed accessors, so you get a concrete return type without a manual cast at the call site:

| Method | Returns |
| --- | --- |
| `getString(string $key, ?string $default = null)` | `string` |
| `getInt(string $key, ?int $default = null)` | `int` |
| `getFloat(string $key, ?float $default = null)` | `float` |
| `getBool(string $key, ?bool $default = null)` | `bool` |
| `getArray(string $key, ?array $default = null)` | `array` |

```php
<?php # src/Comment/CommentConfig.php

use Gacela\Framework\AbstractConfig;

final class CommentConfig extends AbstractConfig
{
    public function getApiKey(): string
    {
        return $this->getString('AKISMET-KEY');   // required: throws if missing or non-string
    }

    public function getMaxRetries(): int
    {
        return $this->getInt('MAX_RETRIES', 3);    // optional: 3 when absent
    }
}
```

::: info
`$default` is `null` by default, which makes the key **required**: a missing key throws immediately instead of failing silently later on. Pass a non-null `$default` to make the key optional — it's returned whenever the key is absent.
:::

::: tip Fails fast on the wrong type
Unlike a bare `(int)`/`(string)` cast, these throw when the stored value doesn't match the requested type instead of silently coercing it. The one exception is `getFloat()`, which also accepts an `int` value. They're also faster than `get()` plus a manual cast, and the return type is visible to static analysis.
:::

Before, with a manual cast and no validation:
```php
$maxRetries = (int) $this->get('MAX_RETRIES', 3);
```

After, with a typed accessor that validates the stored value:
```php
$maxRetries = $this->getInt('MAX_RETRIES', 3);
```

The generic `get(string $key, mixed $default = null): mixed` is still there for values that don't fit these five types.

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

## Inspecting the merged config

`Config::getInstance()->getAllValues()` returns the whole merged configuration as a key-value array — every `config/*.php` file plus environment overrides, already resolved. The [`debug:config`](/docs/gacela-script#debug-config) command prints the same data as a table.
