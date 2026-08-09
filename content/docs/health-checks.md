---
title: Module health checks
description: Report module health through the doctor command, orchestration probes, or application endpoints.
---

# Module health checks

Report each module's operational status and aggregate them into a single system health view. Great for `/health` HTTP
endpoints, container orchestrators and the `doctor` CLI.

## Quick start

### 1. Implement `ModuleHealthCheckInterface`

```php
use Gacela\Framework\Health\HealthStatus;
use Gacela\Framework\Health\ModuleHealthCheckInterface;

final class DatabaseHealthCheck implements ModuleHealthCheckInterface
{
    public function __construct(private readonly PDO $pdo) {}

    public function checkHealth(): HealthStatus
    {
        $this->pdo->query('SELECT 1');

        return HealthStatus::healthy('Database operational');
    }

    public function getModuleName(): string
    {
        return 'Database';
    }
}
```

### 2. Register the check

Register from `gacela.php` to have the Doctor command pick it up automatically, alongside cache-staleness,
suffix-mismatch, and filename-mismatch checks:

```php
<?php # gacela.php

return function (GacelaConfig $config) {
    $config->addHealthCheck(DatabaseHealthCheck::class);
    $config->addHealthCheck(new CacheHealthCheck($redis));
};
```

### 3. Run the checks

```php
use Gacela\Framework\Health\HealthChecker;

$checker = new HealthChecker([
    new DatabaseHealthCheck($pdo),
    new CacheHealthCheck($redis),
]);

$report = $checker->checkAll();
```

…or shell out to the CLI:

```bash
vendor/bin/gacela doctor
```

Pass an optional namespace filter to restrict module checks. In CI, use `vendor/bin/gacela doctor --strict` so warnings
also produce a failing exit code.

## Several checks per module

More than one check may report under the same `getModuleName()`. Gacela combines them into a single module result whose
level is the **worst** one reported, and keeps every individual status under that result's `health_checks` metadata. A
later healthy check therefore cannot hide an earlier degraded or unhealthy one, which is what happened before 2.1: the
results were keyed by module name, so the last check to run overwrote the ones before it.

## Status levels

| Level       | When to use                       |
|-------------|-----------------------------------|
| `healthy`   | Everything works as expected      |
| `degraded`  | Works but slow or using fallbacks |
| `unhealthy` | Critical failure                  |

```php
HealthStatus::healthy('API responding in 50ms');
HealthStatus::degraded('High latency', ['avg_ms' => 500]);
HealthStatus::unhealthy('Unreachable', ['retries' => 3]);
```

## HTTP endpoint

```php
public function healthCheck(): Response
{
    $report = $this->healthChecker->checkAll();

    $status = match ($report->getOverallLevel()) {
        HealthLevel::HEALTHY, HealthLevel::DEGRADED => 200,
        HealthLevel::UNHEALTHY => 503,
    };

    return new JsonResponse($report->toArray(), $status);
}
```

`$report->toArray()`:

```php
[
    'overall' => 'degraded',
    'modules' => [
        'Database'   => ['level' => 'healthy',  'message' => '...', 'metadata' => [...]],
        'PaymentAPI' => ['level' => 'degraded', 'message' => '...', 'metadata' => [...]],
    ],
]
```

## Report API

```php
$report->isHealthy();            // bool
$report->hasUnhealthyModules();  // bool
$report->getOverallLevel();      // HealthLevel
$report->getResults();           // array<string, HealthStatus>
$report->getResultsByLevel(HealthLevel::UNHEALTHY);
$report->toArray();
```

## Best practices

- **Be fast**: checks should complete in under a second. Prefer a quick ping (`SELECT 1`) over full queries.
- **Include metadata**: latency, error codes, retry counts help diagnose issues.
- **Let exceptions propagate**: `HealthChecker` converts any `Throwable` into an `unhealthy` result with exception,
  file, and line metadata.
- **Pick the right level**: reserve `unhealthy` for real outages; use `degraded` for slow-but-working.

## API reference

### `ModuleHealthCheckInterface`

```php
public function checkHealth(): HealthStatus;
public function getModuleName(): string;
```

### `HealthStatus`

```php
HealthStatus::healthy(string $message = 'Module is healthy', array $metadata = []): self
HealthStatus::degraded(string $message, array $metadata = []): self
HealthStatus::unhealthy(string $message, array $metadata = []): self

$status->level;       // HealthLevel
$status->message;     // string
$status->metadata;    // array
$status->isHealthy(): bool
$status->isDegraded(): bool
$status->isUnhealthy(): bool
$status->toArray(): array
```

### `HealthChecker`

```php
$checker->checkAll(): HealthCheckReport
$checker->count(): int
```
