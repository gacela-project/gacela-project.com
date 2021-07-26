+++
template = "section.html"
+++

# Config

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

There is actually a [YAML/YML config reader](https://github.com/gacela-project/gacela-yaml-config-reader) package out-of-the box in the Gacela repository.

This package is not included by default in Gacela because it depends on specific dependencies.


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

// After setting new config readers you have to initialize the config
Config::getInstance()->init();
```

---

## A complete example

```json
# gacela.json
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
    'max-additions' => 20,
];
```

```php
<?php # src/Calculator/Config.php

final class Config extends AbstractConfig
{
    public function getMaxAdditions(): int
    {
        return $this->get('max-additions', $default = 0);
    }
}
```

```php
<?php # src/Calculator/Factory.php

/**
 * @method Config getConfig()
 */
final class Factory extends AbstractFactory
{
    public function createAdder(): AdderInterface
    {
        return new Adder(
            $this->getConfig()->getMaxAdditions()
        );
    }
}
```

