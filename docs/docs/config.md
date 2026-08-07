---
title: Config
description: Read typed application configuration inside a module without coupling domain code to files or environment variables.
---

# Config

Config turns application key-values into typed module settings. The [Factory](/docs/factory) uses those settings while constructing services, keeping file and environment access out of domain code.

::: info
The examples below use PHP config files by default (`config/*.php`). See [Bootstrap > Application Config](/docs/bootstrap#application-config) for other formats and custom readers.
:::

## The config file

Define the application values:
```php
<?php # config/default.php

return [
    'AKISMET-KEY' => 'your-akismet-key',
];
```

## Expose typed module settings

Wrap raw keys in methods named for their meaning inside the module:
```php
<?php # src/Comment/CommentConfig.php

use Gacela\Framework\AbstractConfig;

final class CommentConfig extends AbstractConfig
{
    public function getSpamCheckerEndpoint(): string
    {
        return sprintf(
            'https://%s.rest.akismet.com/1.1/comment-check',
            $this->getString('AKISMET-KEY'),
        );
    }
}
```

## Typed config accessors

`AbstractConfig` provides typed accessors with validation and static-analysis-friendly return types:

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

::: tip Fail fast on the wrong type
Unlike a cast, typed accessors throw when a value has the wrong type. `getFloat()` also accepts integers. The generic `get()` remains available for other value shapes.
:::

## Use Config from the Factory

The Factory passes typed settings into ordinary PHP services:
```php
<?php # src/Comment/CommentFactory.php

use Gacela\Framework\AbstractFactory;

/**
 * @extends AbstractFactory<CommentConfig>
 */
final class CommentFactory extends AbstractFactory
{
    public function createSpamChecker(): SpamChecker
    {
        return new SpamChecker(
            HttpClient::create(),
            $this->getConfig()->getSpamCheckerEndpoint(),
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

## Config files for different environments

Gacela loads a file suffixed with the current `APP_ENV` after the default source:
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
