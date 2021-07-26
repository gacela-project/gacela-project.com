+++
template = "section.html"
+++

# Config

This concept is not a design pattern itself, but it's designed in a way that you can easily access all config values in
your modules, and it's accessible from the Factory out of the box. The Config allows you to construct your business
objects with specific configuration values clearly and straightforwardly.

## Reading the key-values

The `Config` class can get the key-values from your config files. You can define your config files in `gacela.json`.
Why? This `Config` class is accesible from the `Factory`, so you can inject these config values to your business/domain
classes.

In order to achieve that, you need to create a `gacela.json` file in your application root with the following values:

- Config PHP files:
```json
{
  "config": {
    "type": "php",
    "path": "config/*.php",
    "path_local": "config/local.php"
  }
}
```

- Config ENV files:
```json
{
  "config": {
    "type": "env",
    "path": "config/.env*",
    "path_local": "config/.env.local.dist"
  }
}
```

- Multiple and different config files:
```json
{
  "config": [
    {
      "type": "php",
      "path": "config/*.php",
      "path_local": "config/local.php"
    },
    {
      "type": "env",
      "path": "config/.env*",
      "path_local": "config/.env.local.dist"
    }
  ]
}
```

### Keys
- config:
    - type: enum with possible values php or env.
    - path: this is the path of the folder which contains your application configuration. You can use ? or * in order to
      match 1 or multiple characters. Check glob() function for more info.
    - path_local: this is the last file loaded, which means, it will override the previous configuration, so you can
      easily add it to your .gitignore and set your local config values in case you want to have something different for
      some cases.

### Default values

If you don't define any `gacela.json` file, Config will use the "Config PHP files" configuration.

## YamlConfigReader

There is actually a [YAML/YML config reader](https://github.com/gacela-project/gacela-yaml-config-reader) package
out-of-the box in the Gacela repository. This package is not included by default in Gacela because it has its own specific dependencies.


### You can define your own ConfigReaders

You can implement your custom config reader by using `ConfigReaderInterface`,
and setting it to the config-singleton. For example:

```php
<?php
/*
 * This is an example of how can you create your own config reader.
 * The key 'custom' in the ConfigReaders will parse the files found
 * by the gacela.json config:
 * {
 *   "type": "custom",
 *   "path": "config/*.custom"
 * }
 */
Config::getInstance()->setConfigReaders([
    'php' => new PhpConfigReader(),
    'custom' => new CustomConfigReader(),
]);
```

---

## A complete example

```json
{
  "config": {
    "type": "php",
    "path": "config/*.php"
  }
}
```

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

