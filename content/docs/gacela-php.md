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
    public function config(): array 
    {
        return [];
    }

    public function mappingInterfaces(array $globalServices): array 
    {
        return [];
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
    public function config(): array
    {
        return [
            'path' => 'config/*.php',
            'path_local' => 'config/local.php',
        ];
    }
};
```

### Multiple and different config files
```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return fn () => new class() extends AbstractConfigGacela 
{
    public function config(): array
    {
        return [
             [
              'path' => 'config/.env',
              'path_local' => 'config/.env.local',
              'reader' => EnvConfigReader::class,
            ],
            [
              'path' => 'config/*.php',
              'path_local' => 'config/local.php',
              'reader' => PhpConfigReader::class,
            ],
            [
              'path' => 'config/*.custom',
              'path_local' => 'config/local.custom',
              'reader' => CustomConfigReader::class,
            ],
        ];
    }
};
```

#### Config Keys
- `path`: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check [glob()](https://www.php.net/manual/en/function.glob.php) function for more info.
- `path_local`: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases.
- `reader`: specify the reader for those config files. It can be the instance or the class-name. 
  It has to implement `CustomConfigReader`.

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
    public function mappingInterfaces(array $globalServices): array
    {
        return [
            OneInterface::class => ConcreteClass1::class
        ];
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
    public function mappingInterfaces(array $globalServices): array
    {
        $interfaces = [OneInterface::class => OriginalConcrete::class];

        if (isset($globalServices['useUpdatedConcrete'])) {
            $interfaces[OneInterface::class] = UpdatedConcrete::class;
        }

        return $interfaces;
    }
};
```

In the example above, whenever `OneInterface::class` is found then `UpdatedConcrete::class` will be resolved.
