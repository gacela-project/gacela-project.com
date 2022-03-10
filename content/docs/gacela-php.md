+++
title = "gacela.php"
weight = 2
+++

## Using the `gacela.php` config file

You can define the config while bootstrapping Gacela without the need of a `gacela.php` in the root of your project,
however, if this file exists, it will override the configuration from the `Gacela::bootstrap()`.<br/>
It is not mandatory but recommended having a `gacela.php` file in order to decouple and centralize the Gacela configuration.

```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela 
{
    public function config(ConfigBuilder $configBuilder): void
    {
    }

    /**
     * Define the mapping between interfaces and concretions, 
     * so Gacela services will auto-resolve them automatically.
     *
     * @param array<string,mixed> $globalServices
     */
    public function mappingInterfaces(
        MappingInterfacesBuilder $mappingInterfacesBuilder, 
        array $globalServices
    ): void {
    }

    /**
     * Allow overriding gacela resolvable types.
     */
    public function suffixTypes(SuffixTypesBuilder $suffixTypesBuilder): void
    {
    }
};
```

## config()

Similarly to the `Gacela::bootstrap()`, you can define the `config()` in your `gacela.php` file as follows:

### Config PHP files
```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela 
{
    public function config(ConfigBuilder $configBuilder): void
    {
        $configBuilder->add(
            reader: PhpConfigReader::class, 
            path: 'config/*.php',
            pathLocal: 'config/local.php'
        );
    }
};
```

#### Multiple and different config files
```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela 
{
    public function config(ConfigBuilder $configBuilder): void
    {
        $configBuilder->add(EnvConfigReader::class, 'config/.env');
        $configBuilder->add(PhpConfigReader::class, 'config/*.php');
        $configBuilder->add(CustomConfigReader::class, 'config/*.custom');
    }
};
```

You can add to the configBuilder as many config items as you want.

- `reader`: Define the reader class which will read and parse the config files. It must implement `ConfigReaderInterface`.
- `path`: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check [glob()](https://www.php.net/manual/en/function.glob.php) function for more info.
- `pathLocal`: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases.

## mappingInterfaces()

You can define a map between an interface and the concrete class that you want to create (or use) when that interface is
found during the process of **auto-wiring** in any Factory's Module dependencies via its constructor. Let's see an example:

#### Simple mapping

Override the `mappingInterfaces()` method to return an array with the `interface => concreteClass|callable` that you
want to resolve. For example:

```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela 
{
    public function mappingInterfaces(
        MappingInterfacesBuilder $interfacesBuilder,
        array $globalServices
    ): void {
        $interfacesBuilder->bind(OneInterface::class, OneConcrete::class);
    }
};
```

In the example above, whenever `OneInterface::class` is found then `OneConcrete::class` will be resolved.

#### Using GlobalServices or while Mapping Interfaces

First, we pass a key-value array in the second parameter of the `Gacela::bootstrap()` function. In this example 'useUpdatedConcrete':

```php
<?php # index.php
Gacela::bootstrap($appRootDir, ['useUpdatedConcrete' => true]);
```

This way we can access the value of that key `'useUpdatedConcrete'` in the `gacela.php` from `$globalServices`.
For example:
```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela 
{
    public function mappingInterfaces(
        MappingInterfacesBuilder $interfacesBuilder,
        array $globalServices
    ): void {
        $interfacesBuilder->bind(OneInterface::class, OneConcrete::class);
        
        if (isset($globalServices['useUpdatedConcrete'])) {
            $interfacesBuilder->bind(OneInterface::class, UpdatedConcrete::class);
        }
    }
};
```

In the example above, whenever `OneInterface::class` is found then `UpdatedConcrete::class` will be resolved.


## suffixTypes()

Apart from the known Gacela suffix classes: Factory, Config, and DependencyProvider, you can define other suffixes to be
resolved for your different modules. You can do this by adding custom gacela resolvable types.

```php
<?php # index.php

return fn () => new class() extends AbstractConfigGacela 
{
    public function suffixTypes(SuffixTypesBuilder $suffixTypesBuilder): void
    {
        $suffixTypesBuilder
            ->addFactory('Creator')
            ->addConfig('Conf')
            ->addDependencyProvider('Binder');
    }
};
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

return fn () => new class() extends AbstractConfigGacela 
{
    public function config(ConfigBuilder $configBuilder): void
    {
        $configBuilder->add(EnvConfigReader::class, 'config/.env');
        $configBuilder->add(PhpConfigReader::class, 'config/*.php');
        $configBuilder->add(CustomConfigReader::class, 'config/*.custom');
    }

    public function mappingInterfaces(
        MappingInterfacesBuilder $interfacesBuilder,
        array $globalServices
    ): void {
        $interfacesBuilder->bind(OneInterface::class, OneConcrete::class);
        
        if (isset($globalServices['useUpdatedConcrete'])) {
            $interfacesBuilder->bind(OneInterface::class, UpdatedConcrete::class);
        }
    }
    
    public function suffixTypes(SuffixTypesBuilder $suffixTypesBuilder): void
    {
        $suffixTypesBuilder
            ->addFactory('Creator')
            ->addConfig('Conf')
            ->addDependencyProvider('Binder');
    }
};
```

