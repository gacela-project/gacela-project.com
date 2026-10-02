---
title: Module health checks
description: Report module health through the doctor command, orchestrator probes, or application endpoints.
---

# Module health checks

Report each module's status and combine them into one view of system health. Use it for `/health` HTTP endpoints,
container orchestrators and the `doctor` CLI.

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

Register it in `gacela.php`. The `doctor` command then runs it, next to its cache-staleness, suffix-mismatch, and
filename-mismatch checks:

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

Or run the CLI:

```bash
vendor/bin/gacela doctor
```

Pass an optional namespace filter to limit the module checks. In CI, use `vendor/bin/gacela doctor --strict` so
warnings also produce a failing exit code.

## Several checks per module [since 2.1]

Several checks may report under the same `getModuleName()`. Gacela combines them into one module result with the
**worst** level reported, and keeps each individual status under that result's `health_checks` metadata. A later healthy
check cannot hide an earlier degraded or unhealthy one. Before 2.1 it could: results were keyed by module name, so the
last check to run overwrote the ones before it.

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

- **Be fast**: finish each check in under a second. Prefer a quick ping (`SELECT 1`) over a full query.
- **Include metadata**: latency, error codes and retry counts help diagnose problems.
- **Let exceptions propagate**: `HealthChecker` converts any `Throwable` into an `unhealthy` result with exception,
  file, and line metadata.
- **Pick the right level**: keep `unhealthy` for real outages. Use `degraded` for slow but working.

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
