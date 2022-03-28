+++
title = "Bootstrap"
weight = 1
+++

## Initializing Gacela

Gacela should be bootstrapped using the `Gacela::bootstrap` function.<br>
- The first parameter is the application root directory and is mandatory.
- The second one is an optional setup configuration (`SetupGacelaInterface`).

```php
<?php # index.php

Gacela::bootstrap($appRootDir);
```

## SetupGacela
This is the default behaviour for the `SetupGacela` when you don't define anything. 

```php
<?php # index.php

// This is the default configuration.
$setup = (new SetupGacela())
    ->setConfig(static function (ConfigBuilder $configBuilder): void {
        $configBuilder->add(
            path: 'config/*.php',
            pathLocal: 'config/local.php',
            reader: PhpConfigReader::class
        );
    });

Gacela::bootstrap($appRootDir, $setup);
```

Check the [Setup page](/docs/setup/) to see what other behaviours you can alter from Gacela.

## A complete example using gacela.php

```php
<?php # index.php

$kernel = new Kernel($_SERVER['APP_ENV'], (bool)$_SERVER['APP_DEBUG']);

$setup = (new SetupGacela())
    ->setGlobalServices(['symfony/kernel' => $kernel]);

Gacela::bootstrap($appRootDir, $setup);
```

```php
<?php # gacela.php

return (new SetupGacela())
    ->setConfig(static function(ConfigBuilder $configBuilder): void {
        $configBuilder->add('config/.env', '', EnvConfigReader::class);
    })
    ->setMappingInterfaces(static function(
        MappingInterfacesBuilder $mappingBuilder,
        array $globalServices
    ): void {
        /** @var Kernel $kernel */
        $kernel = $globalServices['symfony/kernel'];

        $mappingBuilder->bind(
            EntityManagerInterface::class,
            fn() => $kernel->getContainer()->get('doctrine.orm.entity_manager')
        );
    })
    ->setSuffixTypes(static function(SuffixTypesBuilder $suffixBuilder): void {
        $suffixBuilder
            ->addFactory('Creator')
            ->addConfig('Conf')
            ->addDependencyProvider('Binder');
    });
```
