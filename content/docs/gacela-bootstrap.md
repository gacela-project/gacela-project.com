+++
title = "Bootstrap"
weight = 1
+++

## Initializing Gacela

Gacela should be bootstrapped using the `Gacela::bootstrap` function.<br>
The first parameter is the application root directory and is mandatory, the second one is an array with optional configuration.

```php
<?php # index.php

Gacela::bootstrap($appRootDir);
```

## config

```php
<?php # index.php

// This is the default configuration.

Gacela::bootstrap($appRootDir, [
    'config' => function (ConfigBuilder $configBuilder): void {
        $configBuilder->add(
            path: 'config/*.php',
            pathLocal: 'config/local.php',
            reader: PhpConfigReader::class 
        );
    }
]);
```
You can add to the configBuilder as many config items as you want.

- `path`: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check [glob()](https://www.php.net/manual/en/function.glob.php) function for more info.
- `pathLocal`: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases.
- `reader`: Define the reader class which will read and parse the config files. It must implement `ConfigReaderInterface`.

### EnvConfigReader

There is actually a [Env config reader](https://github.com/gacela-project/gacela-env-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.

### YamlConfigReader

There is actually a [YAML/YML config reader](https://github.com/gacela-project/gacela-yaml-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.

### Custom ConfigReaders

You can implement your custom config reader using `ConfigReaderInterface`:

```php
<?php # index.php

Gacela::bootstrap($appRootDir, [
    'config' => function (ConfigBuilder $configBuilder): void {
        $configBuilder->add(
            'config/*.custom',
            'config/local.custom',
            CustomConfigReader::class
        );
    }
]);
```

## mapping-interfaces

You can define a map between an interface and the concrete class that you want to create (or use) when that interface is
found during the process of **auto-wiring** in any Factory's Module dependencies via its constructor.

In the example below, whenever `OneInterface::class` is found then `OneConcrete::class` will be resolved.

```php
<?php # index.php

Gacela::bootstrap($appRootDir, [
    'mapping-interfaces' => function (
        MappingInterfacesBuilder $interfacesBuilder,
        array $globalServices
    ): void {
        $interfacesBuilder->bind(OneInterface::class, OneConcrete::class);
    }
]);
```

## suffix-types

Apart from the known Gacela suffix classes: Factory, Config, and DependencyProvider, you can define other suffixes to be
resolved for your different modules. You can do this by adding custom gacela resolvable types.

```php
<?php # index.php

Gacela::bootstrap($appRootDir, [
    'suffix-types' => function (SuffixTypesBuilder $suffixTypesBuilder): void {
        $suffixTypesBuilder
            ->addFactory('Creator')
            ->addConfig('Conf')
            ->addDependencyProvider('Binder');
    },
]);
```

In the example above, you'll be able to create a gacela module with these file names:

```bash
ExampleModule
├── Domain
│   └── YourLogicClass.php
├── Creator.php    <- this is the `Factory`
└── Conf.php       <- this is the `Config`
├── Binder.php     <- this is the `DependencyProvider` 
└── EntryPoint.php <- this is the `Facade`
```

> **Notice**: the `Facade` can be named as you want. There are no restrictions for the `Facade` naming suffix.

## A complete example

```php
<?php # index.php

Gacela::bootstrap($appRootDir, [
    'config' => function (ConfigBuilder $configBuilder): void {
        $configBuilder->add(
            'config/*.php',
            'config/local.php',
            PhpConfigReader::class
        );
        $configBuilder->add(EnvConfigReader::class, 'config/.env*');
    },
    'mapping-interfaces' => function (
        MappingInterfacesBuilder $interfacesBuilder,
        array $globalServices
    ): void {
        $interfacesBuilder->bind(OneInterface::class, OneConcrete::class);
    },
    'suffix-types' => function (SuffixTypesBuilder $suffixTypesBuilder): void {
        $suffixTypesBuilder
            ->addFactory('Creator')
            ->addConfig('Conf')
            ->addDependencyProvider('Binder');
    },
]);
```
