---
title: Opcache preload
description: Deploy the Opcache preload script Gacela ships, for its framework classes and your own module classes.
---

# Opcache preload

Gacela ships a preload script that loads its core files into shared memory at PHP startup. Requests no longer compile
those files, and they use less memory. Measure the gain on your own workload.

**Requires** PHP 8.3+ with opcache enabled.

## Setup

Add to `php.ini` (or your FPM pool config):

```ini
opcache.enable=1
opcache.preload=/path/to/project/vendor/gacela-project/gacela/resources/gacela-preload.php
opcache.preload_user=www-data
```

Restart PHP-FPM:

```bash
sudo systemctl restart php8.3-fpm
```

Check the logs for `Gacela Opcache Preload: <n> classes linked, 0 skipped`. The count tracks the framework's size; the
`0` is the part to check.

The line names anything Gacela could not link, and PHP logs its own `Can't preload unlinked class ...` warning next to
it. Both mean PHP dropped the class from the preload image and loads it per request as usual. That breaks the preload
only, not your application.

## Preload your own files

Create `preload/app-preload.php`. Load the classes instead of compiling the files. PHP keeps a compiled class only if
everything it extends, implements and uses was preloaded too, and loading the class is what pulls those in.

```php
<?php
require_once dirname(__DIR__) . '/vendor/autoload.php';

class_exists(App\User\UserFacade::class);
class_exists(App\Product\ProductFacade::class);
```

::: warning Keep it outside your config glob
This file is a script, not configuration: it returns nothing. Put it in `config/` and the default
`addAppConfig('config/*.php')` matches it. Next to a `config/app.php`, Gacela takes it for an [environment layer](/docs/config#config-dimensions) of that
file (`doctor` reports it as one), and a run with `APP_ENV=preload` dies with `The PHP config file
"…/config/app-preload.php" must return an array or a JsonSerializable object!` before anything preloads. Without an
`app.php` next to it, every bootstrap dies that way.
:::

Point an environment variable in your FPM pool at it:

```ini
env[GACELA_PRELOAD_USER_FILES] = /path/to/project/preload/app-preload.php
```

## Deployment

PHP reads the preloaded files once, at startup. Restart PHP-FPM after every deploy:

```bash
composer install --no-dev --optimize-autoloader
sudo systemctl restart php8.3-fpm
```

## When to use it

- **Use it** for high-traffic production apps on PHP 8.3+.
- **Skip it** in local development (you would restart after every change) and on very low-traffic sites.

## Troubleshooting

| Symptom              | Check                                                                         |
|----------------------|-------------------------------------------------------------------------------|
| Files not preloading | `php -v` ≥ 8.3, `php -i \| grep opcache.enable`, preload file readable        |
| Permission denied    | `opcache.preload_user` must match the PHP-FPM user (`ps aux \| grep php-fpm`) |
| `Can't preload unlinked class` | A parent, interface or trait was not preloaded. For your own files, load the class instead of compiling the file (above). |
| Preload aborts on `fopen(php://stdout)` or similar | A package runs I/O in a Composer `files` autoload entry, which the preload context forbids. Install with `--no-dev`, or preload your classes without requiring the full autoloader. |
| Nothing happens on Windows | `opcache.preload` is not supported there. |

## Docker

```dockerfile
FROM php:8.3-fpm
RUN docker-php-ext-install opcache
COPY docker/opcache.ini /usr/local/etc/php/conf.d/
```

```ini
# docker/opcache.ini
opcache.enable=1
opcache.preload=/var/www/html/vendor/gacela-project/gacela/resources/gacela-preload.php
opcache.preload_user=www-data
```

## See also

- [PHP Opcache Documentation](https://www.php.net/manual/en/book.opcache.php)
- [Caching](/docs/caching): other layers (framework resolution, cacheable methods, file cache primitives)
