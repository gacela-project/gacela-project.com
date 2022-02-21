+++
title = "gacela.php"
weight = 6
+++

## Configuring the Config

### config()

#### Using gacela.php

In the root of the project, create a file called `gacela.php`, in which you can define the config key-values such as the following.

##### Config PHP files
```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela {
    public function config(): array
    {
        return [
            'path' => 'config/*.php',
            'path_local' => 'config/local.php',
        ];
    }
};
```

#### Multiple and different config files
```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela {
    public function config(): array
    {
        return [
            ['path' => 'config/.env*'],
            ['path' => 'config/*.php'],
            ['path' => 'config/*.custom'],
        ];
    }
};
```

#### Easy Bootstrapping

You can define the config while bootstrapping your app without the need of `gacela.php`:

```php
<?php # index.php
$projectRootDir = getcwd();
require $projectRootDir . '/vendor/autoload.php';

Gacela::bootstrap($projectRootDir, [
    'config' => [
        'path' => 'config/*.php',
        'path_local' => 'config/local.php',
    ],
]);
```

#### Config Keys
- `path`: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check [glob()](https://www.php.net/manual/en/function.glob.php) function for more info.
- `path_local`: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases.

### mappingInterfaces()

You can define a map between an interface and the concrete class that you want to create (or use) when that interface is
found during the process of **auto-wiring** in any Factory's Module dependencies via its constructor. Let's see an example:

#### Simple mapping

Override the `mappingInterfaces()` method to return an array with the `interface => concreteClass|callable` that you
want to resolve. For example:

```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela {
    public function mappingInterfaces(array $globalServices): array
    {
        return [
            OneInterface::class => ConcreteClass1::class
        ];
    }
};
```

In the example above, whenever `OneInterface::class` is found then `ConcreteClass1::class` will be resolved.

#### Using GlobalServices or while Mapping Interfaces

First, we pass a key-value array in the second parameter of the `Gacela::bootstrap()` function. In this example 'useConcrete2':

```php
<?php # index.php
Gacela::bootstrap(__DIR__, ['useConcrete2' => true]);
```

This way we can access the value of that key `'useConcrete2'` in the `gacela.php` with the function `getGlobalService()`.
For example:

> **Important**: Notice that if you want to use the global services while bootstrapping Gacela, you have to pass them
to the new anon-class that you are returning.

```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela {
    public function mappingInterfaces(array $globalServices): array
    {
        $interfaces = [OneInterface::class => ConcreteClass1::class];

        if (isset($globalServices['useConcrete2'])) {
            $interfaces[OneInterface::class] = ConcreteClass2::class;
        }

        return $interfaces;
    }
};
```

In the example above, whenever `OneInterface::class` is found then `ConcreteClass2::class` will be resolved.

## Default values

If you don't define any `gacela.php` file, the Config will use the "Config PHP files" configuration.

## You can define your own ConfigReaders

You can implement your custom config reader by using `ConfigReaderInterface`,
and setting it to the config-singleton. For example:

```php
<?php declare(strict_types=1);

Gacela::bootstrap($kernel->getProjectDir(), [
    'config-readers' => [
        'php' => new PhpConfigReader(),
        'custom' => new CustomConfigReader(),
    ],
]);
```

### EnvConfigReader

There is actually a [Env config reader](https://github.com/gacela-project/gacela-env-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.

### YamlConfigReader

There is actually a [YAML/YML config reader](https://github.com/gacela-project/gacela-yaml-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.

