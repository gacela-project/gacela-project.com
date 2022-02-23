+++
title = "Bootstrap"
weight = 1
+++

## Initializing Gacela

Gacela should be bootstrapped using the `Gacela::bootstrap` helper.<br/>
The first parameter is the application root directory and is mandatory, the second one is an array with the configuration.

```php
<?php # index.php

Gacela::bootstrap($appRootDir);
```

## config

```php
<?php # index.php

Gacela::bootstrap($appRootDir, [
    'config' => [
        'path' => 'path/*.php'
        'path_local' => 'path/local.php',
    ],
]);
```

- `path`: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check [glob()](https://www.php.net/manual/en/function.glob.php) function for more info.
- `path_local`: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases.

### Default config

If you don't define any `gacela.php` file, the Config will use the following configuration.

```php
<?php # index.php

Gacela::bootstrap($appRootDir, [
    'config' => [
        'path' => 'config/*.php',
        'path_local' => 'config/local.php',
    ],
]);
```

### EnvConfigReader

There is actually a [Env config reader](https://github.com/gacela-project/gacela-env-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.

### YamlConfigReader

There is actually a [YAML/YML config reader](https://github.com/gacela-project/gacela-yaml-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.

### You can define your own ConfigReaders

You can implement your custom config reader by using `ConfigReaderInterface`,
and setting it to the config-singleton. For example:

```php
<?php # index.php

Gacela::bootstrap($appRootDir, [
    'config-readers' => [
        new PhpConfigReader(),
        new CustomConfigReader(),
    ],
]);
```

## mapping-interfaces

You can define a map between an interface and the concrete class that you want to create (or use) when that interface is
found during the process of **auto-wiring** in any Factory's Module dependencies via its constructor. Let's see an example:

In the example above, whenever `OneInterface::class` is found then `ConcreteClass1::class` will be resolved.

```php
<?php # index.php

Gacela::bootstrap($appRootDir, [
    'mapping-interfaces' => [
        OneInterface::class => ConcreteClass1::class,
    ],
]);
```

## A complete example

```php
<?php # index.php

Gacela::bootstrap($appRootDir, [
    'config' => [
        ['path' => 'config/.env*'],
        ['path' => 'config/*.php'],
    ],
    'config-readers' =>  [
        PhpConfigReader::class,
        SimpleEnvConfigReader::class,
    ],
    'mapping-interfaces' =>  [
        OneInterface::class => ConcreteClass1::class,
        TwoInterface::class => ConcreteClass2::class,
    ],
]);
```
