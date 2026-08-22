---
title: Config
description: Read typed application configuration inside a module without coupling domain code to files or environment variables.
---

# Config

Config turns application key-values into typed module settings. The [Factory](/docs/factory) uses those settings while
constructing services, keeping file and environment access out of domain code.

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
`$default` is `null` by default, which makes the key **required**: a missing key throws immediately instead of failing
silently later on. Pass a non-null `$default` to make the key optional — it's returned whenever the key is absent.
:::

::: tip Fail fast on the wrong type
Unlike a cast, typed accessors throw when a value has the wrong type. `getFloat()` also accepts integers. The generic
`get()` remains available for other value shapes.
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

## Config dimensions [since 2.3]

`APP_ENV` is one axis. A project that also varies by region, tenant or brand needs more, and `addConfigDimension()`
declares each extra environment variable that selects configuration:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->addAppConfig('config/*.php');

    $config->addConfigDimension('APP_REGION');
    $config->addConfigDimension('APP_TENANT');
};
```

Declaration order is the order of the chain, and each layer refines the one before it. With `APP_ENV=prod` and
`APP_REGION=eu`, Gacela reads:

1. `config/app.php`
2. `config/app-prod.php`
3. `config/app-prod-eu.php`

A variable that is unset ends the chain, so `APP_ENV=prod` alone stops after the second layer. A local override file
is still read last and still wins.

The merged configuration cache is keyed by the **whole tuple**, so two regions never serve each other's values. Warm
one cache per combination you deploy:

```bash
APP_REGION=eu vendor/bin/gacela cache:warm
APP_REGION=us vendor/bin/gacela cache:warm
```

::: warning A dimension value reaches the filesystem
A value may contain only letters, digits, `_`, `.` and `-`, and `APP_ENV` is held to the same alphabet as of 2.3.
Anything else throws. A dimension reaches both a glob pattern and a cache filename: `APP_ENV=../escaped` used to write
the merged-config cache outside its directory, and `APP_ENV=x/../../pwned` failed silently and booted uncached.
:::

## Config values without files

`addAppConfigKeyValue()` and `addAppConfigKeyValues()` set configuration keys directly on `GacelaConfig`, in
`gacela.php` or the bootstrap closure:

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

Keys set this way are merged **after** every file source, so they override values from `config/*.php`, environment
files, and local overrides. Schema-declared defaults sit at the other end: a key nobody provides falls back to its
declaration, and any source, including these methods, wins over it.

This is also how tests override configuration:
[`GacelaTestCase::bootstrapGacelaWithConfig()`](/docs/testing#gacelatestcase) passes its key-values through
`addAppConfigKeyValues()`.

## Declaring a config schema [since 2.2]

[`validate:config`](/docs/cli#validate-config) checks the wiring: bindings, dependency cycles. Nothing checked
the configuration itself, so a missing or misspelled key surfaced as a runtime failure in whichever environment lacked
it: usually production, usually far from the file that should have carried it. Every call site already knows what it
expects, `getInt('retries')` says so, but that expectation was written nowhere a command could read before anything ran.

Declare it in `gacela.php`:

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
- `default($value)`: used when no source provides the key, never over one that does. A defaulted key is therefore never
  missing, and cannot also be required.
- `describe($text)`: travels into the violation, where "wrong type" alone leaves the reader guessing.

A `float` accepts an `int`: `timeout: 5` in a config file is about the value, not about PHP's literal syntax. Nothing
else is coerced; `'true'` is not a `bool`.

Declarations merge per key, so `declareConfigSchema()` can be called more than once and an extended config can refine
one key without repeating the rest. The later declaration of a key wins.

### Where it is checked

Nothing is checked while booting. The declaration is read by the commands you already run:

```bash
vendor/bin/gacela validate:config   # non-zero when a declared key is unsatisfied
vendor/bin/gacela doctor            # the same, as one more check in the deploy gate
vendor/bin/gacela debug:config      # marks every key declared / undeclared / missing
```

`debug:config` is the counterweight in the other direction: a schema can only report the keys it declares, so the table
flags the ones it does *not*, and lists a declared key nothing provides even though it has no value to show.

### Checking on boot, locally

```php
$config->validateConfigSchemaOnBoot();
```

Moves the report from a command you have to remember to run to the first thing that boots, and throws a
`ConfigException` listing every violation. It is off by default so bootstrap does no work a project did not ask for.
Leave it off in production, where the deploy gate has already answered the question.

Declared **defaults** are applied either way: a key with a default is not missing, it is provided by the declaration.

## Inspecting the merged config

`Config::getInstance()->getAllValues()` returns the whole merged configuration as a key-value array — every
`config/*.php` file plus environment overrides, already resolved. The [`debug:config`](/docs/cli#debug-config)
command prints the same data as a table, with each key marked against the [declared schema](#declaring-a-config-schema).
