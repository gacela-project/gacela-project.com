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

## Preload your own files

Create `config/app-preload.php`:

```php
<?php
$root = dirname(__DIR__);

opcache_compile_file($root . '/src/User/UserFacade.php');
opcache_compile_file($root . '/src/Product/ProductFacade.php');
```

Point an environment variable in your FPM pool at it:

```ini
env[GACELA_PRELOAD_USER_FILES] = /path/to/project/config/app-preload.php
```

## Deployment

PHP reads the preloaded files once, at startup. Restart PHP-FPM after every deploy:

```bash
composer install --no-dev --optimize-autoloader
vendor/bin/gacela cache:warm
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
