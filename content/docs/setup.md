+++
title = "Setup"
weight = 2
+++


You can define the setup while bootstrapping Gacela without the need of a `gacela.php` in the root of your project,
however, if this file exists, it will override the configuration from the `Gacela::bootstrap()`.<br/>
It is not mandatory but recommended having a `gacela.php` file in order to decouple and centralize the Gacela configuration.

In other words, you can modify some Gacela behaviour from two different places:

1. Directly passing it as 2nd argument to `Gacela::bootstrap()` (see [Bootstrap](/docs/bootstrap/))
2. Or using `gacela.php` returning a `SetupGacela` object.

Anyway, a similar instance can be used. and it will be internally combined.


```php
<?php # gacela.php

return (new SetupGacela())
    /**
     * Define different config sources.
     */
    ->setConfig(function (ConfigBuilder $configBuilder): void {
        // ...
    })

    /**
     * Define the mapping between interfaces and concretions, 
     * so Gacela services will auto-resolve them automatically.
     *
     * @param array<string,mixed> $externalServices
     */
    ->setMappingInterfaces(function (
        MappingInterfacesBuilder $mappingInterfacesBuilder,
        array $externalServices
    ): void {
        // ...
    })

    /**
     * Allow overriding gacela resolvable types.
     */
    ->setSuffixTypes(function (SuffixTypesBuilder $suffixTypesBuilder): void {
        // ...
    });
```

## Config

Using the ConfigBuilder you can add different paths and use different config file types, even with custom config
readers. The `PhpConfigReader` is used by default.

### Config PHP files
```php
<?php

$setup = (new SetupGacela())
    ->setConfig(function (ConfigBuilder $configBuilder): void {
        $configBuilder->add(
            path: 'config/*.php',
            pathLocal: 'config/local.php',
            reader: PhpConfigReader::class 
        );
    });
```

You can add to the `$configBuilder` as many config locations as you want.

- `path`: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check [glob()](https://www.php.net/manual/en/function.glob.php) function for more info.
- `pathLocal`: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases.
- `reader`: Define the reader class which will read and parse the config files. It must implement `ConfigReaderInterface`.

#### Multiple and different config files

```php
<?php

$setup = (new SetupGacela())
    ->setConfig(function (ConfigBuilder $configBuilder): void {
        $configBuilder->add('config/.env', '', EnvConfigReader::class);
        $configBuilder->add('config/*.custom', '', CustomConfigReader::class);
        $configBuilder->add('config/*.php', 'config/local.php');
    });
```

## Mapping Interfaces

You can define a map between an interface and the concrete class that you want to create (or use) when that interface is
found during the process of **auto-wiring** in any Factory's Module dependencies via its constructor. Let's see an example:

#### Simple mapping

The MappingInterfacesBuilder instance let you bind a class with another class `interface => concreteClass|callable` 
that you want to resolve. For example:

```php
<?php

$setup = (new SetupGacela())
    ->setMappingInterfaces(function (
        MappingInterfacesBuilder $interfacesBuilder,
        array $externalServices
    ): void {
        $interfacesBuilder->bind(AbstractString::class, StringClass::class);
        $interfacesBuilder->bind(ClassInterface::class, new ConcreteClass(/*args*/));
        $interfacesBuilder->bind(ComplexInterface::class, new class() implements Foo { /** logic */ });
        $interfacesBuilder->bind(FromCallable::class, fn() => new StringClass('From callable'));
    });
```

In the example above, whenever `OneInterface::class` is found then `OneConcrete::class` will be resolved.

#### Using externalServices

First, we set global services as a key-value array from the `SetupGacela->setExternalServices()`. 
In this example `'useUpdatedConcrete'`:

```php
<?php # index.php
$setup = (new SetupGacela())
    ->setExternalServices(['useUpdatedConcrete' => true]);

Gacela::bootstrap($appRootDir, $setup);
```

This way we can access the value of that key `'useUpdatedConcrete'` in the `gacela.php` from `$externalServices`.
For example:
```php
<?php

$setup = (new SetupGacela())
    ->setMappingInterfaces(function (
        MappingInterfacesBuilder $mappingInterfacesBuilder,
        array $externalServices
    ): void {
        $interfacesBuilder->bind(OneInterface::class, OneConcrete::class);
        
        if (isset($externalServices['useUpdatedConcrete'])) {
            $interfacesBuilder->bind(OneInterface::class, UpdatedConcrete::class);
        }
    });
```

In the example above, whenever `OneInterface::class` is found then `UpdatedConcrete::class` will be resolved.

## Suffix Types

Apart from the known Gacela suffix classes: `Factory`, `Config`, and `DependencyProvider`, you can define other suffixes to be
resolved for your different modules. You can do this by adding custom gacela resolvable types.

```php
<?php

$setup = (new SetupGacela())
    ->setSuffixTypes(function (SuffixTypesBuilder $suffixBuilder): void {
        $suffixBuilder
            ->addFactory('Creator')
            ->addConfig('Conf')
            ->addDependencyProvider('Binder');
    });
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
<?php # gacela.php

return (new SetupGacela())
    ->setConfig(function (ConfigBuilder $configBuilder): void {
        $configBuilder->add('config/.env', '', EnvConfigReader::class);
        $configBuilder->add('config/*.custom', '', CustomConfigReader::class);
        $configBuilder->add('config/*.php', 'config/local.php');
    })
    ->setMappingInterfaces(function (
        MappingInterfacesBuilder $mappingInterfacesBuilder,
        array $externalServices
    ): void {
        $interfacesBuilder->bind(OneInterface::class, OneConcrete::class);
        
        if (isset($externalServices['useUpdatedConcrete'])) {
            $interfacesBuilder->bind(OneInterface::class, UpdatedConcrete::class);
        }
    })
    ->setSuffixTypes(function (SuffixTypesBuilder $suffixBuilder): void {
        $suffixBuilder
            ->addFactory('Creator')
            ->addConfig('Conf')
            ->addDependencyProvider('Binder');
    });
```
