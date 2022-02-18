+++
title = "Config"
weight = 4
+++

This concept is not a design pattern itself, but it's designed in a way that you can easily access all config values in
your modules, and it's accessible from the Factory out of the box. The Config allows you to construct your business
objects with specific configuration values clearly and straightforwardly.

## A complete example

It will use the "Config PHP files" by default. This is all files in `'config/*.php'`.

First, this is the config file with the config key-values:
```php
<?php # config/default.php

return [
    'AKISMET-KEY' => 'your-private-key',
];
```

Then using the Config class you can access those config values by their keys:
```php
<?php # src/Comment/CommentConfig.php

use Gacela\Framework\AbstractConfig;

final class CommentConfig extends AbstractConfig
{
    public function getSpamCheckerEndpoint(): string 
    {
        return sprintf(
            'https://%s.rest.akismet.com/1.1/comment-check', 
            $this->get('AKISMET-KEY')
        );
    }
} 
```

You can access the Config methods from the Factory, to create your domain logic stuff:
```php
<?php # src/Comment/CommentFactory.php

use Gacela\Framework\AbstractFactory;

/**
 * @method CommentConfig getConfig()
 */
final class CommentFactory extends AbstractFactory
{
    public function createSpamChecker(): SpamChecker
    {
        return new SpamChecker(
            HttpClient::create(),
            $this->getConfig()->getSpamCheckerEndpoint()
        );
    }    
}
```

Which will be used finally by the module's Facade:

```php
<?php # src/Comment/CommentFacade.php

namespace App\Comment;

use Gacela\Framework\AbstractFacade;

/**
 * @method CommentFactory getFactory()
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

<br>

-------

## Configuring the Config

### config() 

#### Easy Bootstrapping

You can define the config while bootstrapping your app without the need of an extra file: 

```php
<?php # index.php
$projectRootDir = getcwd();
require $projectRootDir . '/vendor/autoload.php';

Gacela::bootstrap($projectRootDir, [
    'config' => [
        'type' => 'php',
        'path' => 'config/*.php',
        'path_local' => 'config/local.php',
    ],
]);
```

#### Using gacela.php 

In the root of the project, you could also create a file called `gacela.php`, in which you can define the config
key-values such as the following.  

##### Config PHP files
```php
<?php # gacela.php
use Gacela\Framework\AbstractConfigGacela;

return static fn () => new class() extends AbstractConfigGacela {
    public function config(): array
    {
        return [
            'type' => 'php',
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

return static fn () => new class() extends AbstractConfigGacela {
    public function config(): array
    {
        return [
            [
                'type' => 'env',
                'path' => 'config/.env*',
            ],
            [
                'type' => 'php',
                'path' => 'config/*.php',
            ],
            [
                'type' => 'custom',
                'path' => 'config/*.custom',
            ],
        ];
    }
};
```

#### Config Keys
- `type`: enum with possible values php or env.
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

return static fn () => new class() extends AbstractConfigGacela {
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

return static fn () => new class() extends AbstractConfigGacela {
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

Gacela::bootstrap($kernel->getProjectDir(), ['config-readers' => [
    'php' => new PhpConfigReader(),
    'custom' => new CustomConfigReader(),
]]);
```

### EnvConfigReader

There is actually a [Env config reader](https://github.com/gacela-project/gacela-env-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.

### YamlConfigReader

There is actually a [YAML/YML config reader](https://github.com/gacela-project/gacela-yaml-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.
