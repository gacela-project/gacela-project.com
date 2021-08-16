+++
title = "Config"
template = "section.html"
+++

# Config

This concept is not a design pattern itself, but it's designed in a way that you can easily access all config values in
your modules, and it's accessible from the Factory out of the box. The Config allows you to construct your business
objects with specific configuration values clearly and straightforwardly.

## Reading the key-values

The `Config` class can get the key-values from your config files. You can define your config files in `gacela.php`.
Why? This `Config` class is accesible from the `Factory`, so you can inject these config values to your business/domain
classes.

In order to achieve that, you need to create a `gacela.php` file in your application root:

### ConfigGacela -> config() 

#### Config PHP files
```php
<?php declare(strict_types=1);
use Gacela\Framework\AbstractConfigGacela;

return static function (array $globalServices): AbstractConfigGacela {
    return new class($globalServices) extends AbstractConfigGacela {
        public function config(): array
        {
            return [
                'type' => 'php',
                'path' => 'config/*.php',
                'path_local' => 'config/local.php',
            ];
        }
    };
};
```

#### Config ENV files
```php
<?php declare(strict_types=1);
use Gacela\Framework\AbstractConfigGacela;

return static function (array $globalServices): AbstractConfigGacela {
    return new class($globalServices) extends AbstractConfigGacela {
        public function config(): array
        {
            return [
                'type' => 'env',
                'path' => 'config/.env*',
                'path_local' => 'config/.env.local.dist',
            ];
        }
    };
};
```

#### Multiple and different config files
```php
<?php declare(strict_types=1);
use Gacela\Framework\AbstractConfigGacela;

return static function (array $globalServices): AbstractConfigGacela {
    return new class($globalServices) extends AbstractConfigGacela {
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
};
```

#### Config Keys
- type: enum with possible values php or env.
- path: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check glob() function for more info.
- path_local: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases.

### ConfigGacela -> mappingInterfaces()

You can define a map between an interface and the concrete class that you want to create/use when that interface is found
during the process of auto-wiring of the dependencies of the Factory via its constructor.

```php
<?php declare(strict_types=1);
use Gacela\Framework\AbstractConfigGacela;

return static function (array $globalServices): AbstractConfigGacela {
    return new class($globalServices) extends AbstractConfigGacela {
        public function mappingInterfaces(): array
        {
            $interfaces = [OneInterface::class => ConcreteClass1::class];

            if ('yes!' === $this->getGlobalService('isWorking?')) {
                $interfaces[OneInterface::class] = ConcreteClass2::class;
            }

            return $interfaces;
        }
    };
};
```

As one step forward, you can let know Gacela the global services that you want to have access in your `gacela.php` config file
by passing them in the entry point of your app: 
```php
<?php declare(strict_types=1);

Gacela::bootstrap(
    applicationRootDir: __DIR__,
    globalServices: ['isWorking?' => 'yes!']
);
```

In the example above, whenever `OneInterface::class` is found then `ConcreteClass2::class` will be resolved.

### Default values

If you don't define any `gacela.php` file, the Config will use the "Config PHP files" configuration.

## You can define your own ConfigReaders

You can implement your custom config reader by using `ConfigReaderInterface`,
and setting it to the config-singleton. For example:

```php
<?php declare(strict_types=1);

Config::getInstance()->setConfigReaders([
    'php' => new PhpConfigReader(),
    'custom' => new CustomConfigReader(),
]);
```

### YamlConfigReader

There is actually a [YAML/YML config reader](https://github.com/gacela-project/gacela-yaml-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.

---

## A complete example

Non gacela.php needed. It will use the "Config PHP files" by default.

```php
<?php # config/default.php

return [
    'AKISMET-KEY' => 'your-private-key',
];
```

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

