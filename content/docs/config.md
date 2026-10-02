---
title: Config
description: Read typed application configuration inside a module without coupling domain code to files or environment variables.
---

# Config

Config turns application key-values into typed module settings. The [Factory](/docs/factory) passes those settings to
the services it builds, so domain code never reads files or environment variables.

::: info
The examples below use PHP config files by default (`config/*.php`).
See [Bootstrap > Application Config](/docs/bootstrap#application-config) for other formats and custom readers.
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

Wrap each raw key in a method named for what it means inside the module:

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

`AbstractConfig` provides typed accessors. They validate the value and give static analysis a precise return type:

| Method                                            | Returns  |
|---------------------------------------------------|----------|
| `getString(string $key, ?string $default = null)` | `string` |
| `getInt(string $key, ?int $default = null)`       | `int`    |
| `getFloat(string $key, ?float $default = null)`   | `float`  |
| `getBool(string $key, ?bool $default = null)`     | `bool`   |
| `getArray(string $key, ?array $default = null)`   | `array`  |

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
`$default` is `null` by default, which makes the key **required**: a missing key throws at once instead of failing
silently later. Pass a non-null `$default` to make the key optional. Gacela returns it whenever the key is absent.
:::

::: tip Fail fast on the wrong type
Unlike a cast, a typed accessor throws when the value has the wrong type. `getFloat()` also accepts integers. For other
value shapes, use the generic `get()`.
:::

## Use Config from the Factory

The Factory passes typed settings to plain PHP services:

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

The module's Facade uses the Factory, which completes the chain **Facade → Factory → Config**:

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

After the default source, Gacela loads the file suffixed with the current `APP_ENV`:

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

## Config dimensions [since 2.3]

`APP_ENV` is one axis. A project that also varies by region, tenant or brand needs more. `addConfigDimension()`
declares each extra environment variable that selects configuration:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->addAppConfig('config/*.php');

    $config->addConfigDimension('APP_REGION');
    $config->addConfigDimension('APP_TENANT');
};
```

The chain follows declaration order, and each layer refines the one before it. With `APP_ENV=prod` and
`APP_REGION=eu`, Gacela reads:

1. `config/app.php`
2. `config/app-prod.php`
3. `config/app-prod-eu.php`

An unset variable ends the chain, so `APP_ENV=prod` alone stops after the second layer. A local override file is still
read last and still wins.

The wildcard does not pull the layers into the base. A match named after another match plus one or more `-<segment>`
parts, such as `config/app-prod-eu.php` beside `config/app.php`, is that file's environment layer. Gacela reads it only
when the chain selects it, so a key set only in `config/app-prod.php` is not readable outside `APP_ENV=prod`. The rule
reads names, not intent, so it excludes a `config/app-extra.php` too. [`doctor`](/docs/cli#doctor) names every file
excluded this way. [since 2.4]

The merged configuration cache is keyed by the **whole tuple**, so two regions never serve each other's values. Warm one
cache per combination you deploy:

```bash
APP_REGION=eu vendor/bin/gacela cache:warm
APP_REGION=us vendor/bin/gacela cache:warm
```

::: warning A dimension value reaches the filesystem
A value may contain only letters, digits, `_`, `.` and `-`. Since 2.3, `APP_ENV` follows the same rule. Anything else
throws. A dimension reaches both a glob pattern and a cache filename: `APP_ENV=../escaped` used to write the
merged-config cache outside its directory, and `APP_ENV=x/../../pwned` failed silently and booted uncached.
:::

## Config values without files

`addAppConfigKeyValue()` and `addAppConfigKeyValues()` set configuration keys directly on `GacelaConfig`, in
`gacela.php` or in the bootstrap closure:

```php
<?php # gacela.php

return static function (GacelaConfig $config): void {
    $config->addAppConfigKeyValue('retries', 3);

    $config->addAppConfigKeyValues([
        'db.dsn' => 'pgsql://localhost/app',
        'features' => ['beta' => true],
    ]);
};
```

Gacela merges these keys **after** every file source, so they override values from `config/*.php`, environment files
and local overrides. Schema defaults sit at the other end: a key no source provides falls back to its declared default,
and any source, these methods included, wins over it.

Tests override configuration the same way:
[`GacelaTestCase::bootstrapGacelaWithConfig()`](/docs/testing#gacelatestcase) passes its key-values through
`addAppConfigKeyValues()`.

## Declaring a config schema [since 2.2]

[`validate:config`](/docs/cli#validate-config) checks the wiring: bindings and dependency cycles. Nothing checked the
configuration itself. A missing or misspelled key surfaced as a runtime failure in whichever environment lacked it:
usually production, usually far from the file that should have carried it. Every call site knows what it expects
(`getInt('retries')` says so), but no command could read that expectation before anything ran.

A schema writes it down. Declare it in `gacela.php`:

```php [gacela.php]
use Gacela\Framework\Bootstrap\GacelaConfig;
use Gacela\Framework\Config\Schema\ConfigType;

return static function (GacelaConfig $config): void {
    $config->declareConfigSchema([
        'db.dsn'   => ConfigType::string()->required(),
        'retries'  => ConfigType::int()->default(3),
        'features' => ConfigType::array()->required()->describe('feature flags, keyed by name'),
    ]);
};
```

Types: `string()`, `int()`, `float()`, `bool()`, `array()`.

- `required()`: the key must be present after every source is merged.
- `default($value)`: used when no source provides the key, never over one that does. A defaulted key is never missing,
  so it cannot also be required.
- `describe($text)`: travels into the violation message, where "wrong type" alone leaves the reader guessing.

A `float` accepts an `int`: `timeout: 5` in a config file states a value, not PHP literal syntax. Nothing else is
coerced. `'true'` is not a `bool`.

Declarations merge per key. You can call `declareConfigSchema()` more than once, and an extended config can refine one
key without repeating the rest. The later declaration of a key wins.

### Where it is checked

Booting checks nothing. The commands you already run read the declaration:

```bash
vendor/bin/gacela validate:config   # non-zero when a declared key is unsatisfied
vendor/bin/gacela doctor            # the same, as one more check in the deploy gate
vendor/bin/gacela debug:config      # marks every key declared / undeclared / missing
```

`debug:config` covers the other direction. A schema can only report the keys it declares, so the table flags the ones
it does *not*. It also lists a declared key that nothing provides, even though it has no value to show.

### Checking on boot, locally

```php
$config->validateConfigSchemaOnBoot();
```

This moves the report from a command you must remember to run into the first boot. It throws a `ConfigException` that
lists every violation. It is off by default, so bootstrap does no work a project did not ask for. Leave it off in
production, where the deploy gate has already run the check.

Declared **defaults** apply either way: a key with a default is not missing, because the declaration provides it.

## Inspecting the merged config

`Config::getInstance()->getAllValues()` returns the whole merged configuration as a key-value array: every
`config/*.php` file plus environment overrides, already resolved. [`debug:config`](/docs/cli#debug-config) prints the
same data as a table and marks each key against the [declared schema](#declaring-a-config-schema).
