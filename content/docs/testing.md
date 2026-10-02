---
title: Testing
description: Test Gacela applications with isolated container state, temporary directories, and lifecycle-event assertions.
---

# Testing

Gacela ships two PHPUnit helpers for tests: `GacelaTestCase`, the recommended base class for tests that bootstrap a
Gacela app, and `ContainerFixture`, the lower-level trait it builds on. PHPUnit is a suggested development dependency,
not a Gacela runtime dependency, so require it in your application when using these helpers.

## GacelaTestCase

`GacelaTestCase` is the recommended base class for tests that bootstrap a Gacela app. It extends PHPUnit's `TestCase`,
uses the [`ContainerFixture`](#containerfixture) trait internally, and takes care of teardown for you. Reach for
`ContainerFixture` directly only when you can't extend this class.

### Setup

```php
use Gacela\Framework\Testing\GacelaTestCase;

final class CheckoutTest extends GacelaTestCase
{
    public function test_facade_resolves_payment_gateway(): void
    {
        $this->bootstrapGacelaWithConfig(__DIR__, ['retries' => 3]);

        (new CheckoutFacade())->pay();

        $this->assertServiceResolved(PaymentGateway::class);
    }
}
```

No `#[Before]` or `resetContainer()` call needed. `bootstrapGacela()` / `bootstrapGacelaWithConfig()` reset the
in-memory cache before bootstrapping, and `tearDown()` resets the container and clears recorded events automatically, so
state never leaks between tests.

### Available methods

| Method                                                                  | Description                                                                                                                                                                    |
|-------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `bootstrapGacela(string $appRootDir, ?Closure $configFn = null)`        | Bootstrap Gacela from a clean in-memory state and start recording lifecycle events dispatched from this point onward. Optional closure receives `GacelaConfig` for extra setup |
| `bootstrapGacelaWithConfig(string $appRootDir, array $configKeyValues)` | Bootstrap with the given config key-values in one call (calls `addAppConfigKeyValues()` internally). The most common override in tests                                         |
| `recordedGacelaEvents()`                                                | All `GacelaEventInterface` events recorded since the last bootstrap, in dispatch order                                                                                         |
| `recordedGacelaEventsOf(string $eventClass)`                            | The recorded events of one type, in dispatch order                                                                                                                             |
| `assertServiceResolved(string $serviceId)`                              | Assert the container instantiated the given service id since the last bootstrap                                                                                                |
| `assertBindingRegistered(string $id)`                                   | Assert a binding, alias or contextual binding was registered under the given id since the last bootstrap                                                                       |

::: tip Event-backed assertions
`assertServiceResolved()` and `assertBindingRegistered()` read from Gacela's own lifecycle events
(`ServiceResolvedEvent` and `BindingRegisteredEvent`), recorded automatically from `bootstrapGacela()` onward. See
the [events catalog](/docs/events) for the full list, and fall back to `recordedGacelaEvents()` /
`recordedGacelaEventsOf()` for anything the two helpers don't cover.
:::

### Asserting on recorded events

Use `recordedGacelaEventsOf()` for anything more specific than "was a service resolved" — counting events, or reading a
payload off one:

```php
use Gacela\Framework\Event\Config\ConfigKeyReadEvent;
use Gacela\Framework\Event\Container\ServiceResolvedEvent;
use Gacela\Framework\Testing\GacelaTestCase;

final class CheckoutEventsTest extends GacelaTestCase
{
    public function test_payment_gateway_is_resolved_once(): void
    {
        $this->bootstrapGacela(__DIR__);

        (new CheckoutFacade())->pay();
        (new CheckoutFacade())->pay();

        self::assertCount(1, $this->recordedGacelaEventsOf(ServiceResolvedEvent::class));
    }

    public function test_retries_key_is_read_from_config(): void
    {
        $this->bootstrapGacelaWithConfig(__DIR__, ['retries' => 3]);

        (new CheckoutFacade())->pay();

        $events = $this->recordedGacelaEventsOf(ConfigKeyReadEvent::class);

        self::assertSame('retries', $events[0]->key());
    }
}
```

### Asserting on bindings

```php
use Gacela\Framework\Testing\GacelaTestCase;

final class LoggingBindingTest extends GacelaTestCase
{
    public function test_logger_binding_is_registered(): void
    {
        $this->bootstrapGacela(__DIR__, function (GacelaConfig $config) {
            $config->addBinding(LoggerInterface::class, NullLogger::class);
        });

        $this->assertBindingRegistered(LoggerInterface::class);
    }
}
```

## Testing one module [since 2.4]

The everyday test of a modular application is one module with its neighbours replaced. `bootstrapModule()` does it in
one call:

```php
$this->bootstrapModule(__DIR__, InvoiceFacade::class, doubles: [
    BillingFacade::class => $this->createStub(BillingFacade::class),
    PaymentGatewayInterface::class => new FakeGateway(),
]);

$invoice = (new InvoiceFacade())->issue('acme-nl', 10_000);
```

Two things happen.

**Discovery is narrowed** to the directory the Facade lives in. `doctor`, `list:modules` and `debug:graph` then answer
about that module instead of the whole application. The narrowing is applied after `gacela.php` has been read, so an
application that declares its own `setAppModulePaths()` does not silently undo it.

**Each double is applied through the seam that fits it**, so the test does not have to know which one a dependency
arrives on:

| The double is                                                            | It becomes                                                                                                    |
|--------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| an `AbstractFactory`, `AbstractConfig` or `AbstractProvider` instance    | that pillar of the module its key's **Facade** names, as with the `swapModule*()` calls below                  |
| any other object, keyed by a class or interface                          | a container binding, a lazy service, a binding scoped to the module's pillars, and a resolved-class override   |
| a `Closure` or a class-string, keyed by a class or interface             | a container binding, a lazy service, and a binding scoped to the module's pillars                              |
| anything, keyed by a **container id**                                    | a replacement for that id wherever it is registered, including in the module's own Provider                     |

The binding scoped to the module's pillars wins over a class the application's `gacela.php` binds for the same type,
while every class outside the module keeps what `gacela.php` declares.

The fourth argument, `configFn`, is a `GacelaConfig` closure composed with the narrowing rather than replacing it:

```php
$this->bootstrapModule(__DIR__, InvoiceFacade::class,
    doubles: [BillingFacade::class => $billing],
    configFn: static fn (GacelaConfig $config) => $config->addExternalService('clock', $frozenClock),
);
```

Like `bootstrapGacela()`, it bootstraps once per test, and `tearDown()` drops everything it registered.

- **A neighbour has to leave its Facade open.** A consumer that type-hints a `final` Facade cannot be handed a
  stand-in for it. Where the Facade must stay `final`, replace the neighbour's Factory instead.
- **A double must be an instance of what it is registered under.** Otherwise it is refused with a
  `ModuleDoubleException`, rather than failing at the consumer that type-hints the real one.
- **Whether the module actually depends on the doubled class is not checked.** Reflection cannot see every way a
  module reaches a dependency, so such a check would refuse legitimate tests.

The [upstream testing guide](https://github.com/gacela-project/gacela/blob/main/docs/testing.md#testing-one-module-bootstrapmodule)
covers the routing in more depth.

## Replacing another module [since 2.2]

Testing module A in isolation means replacing module B. A container binding only works when B's Facade arrives through
a Provider, and a consumer that writes `new BlogFacade()` leaves nothing to bind. So the seam is the **Factory** every
Facade resolves:

```php
$this->swapModuleFactory(BlogFacade::class, new class() extends AbstractFactory {
    public function createPostReader(): PostReader
    {
        return new InMemoryPostReader(['a post']);
    }
});

(new CheckoutFacade())->summary();  // reaches the double, not the real Blog
```

The double extends `AbstractFactory`, not `BlogFactory`. It only has to carry the methods the Facade under test
actually calls: `swapModuleFactory()` takes an `AbstractFactory`, so the double does not have to be Blog's own class.

**If `BlogFactory` is `final`, that is the only form available.** A `final` class cannot be subclassed (PHP raises a
fatal error) and cannot be doubled by PHPUnit either (`ClassIsFinalException`), so neither
`new class() extends BlogFactory` nor `$this->createStub(BlogFactory::class)` runs. `make:module` generates `final`
pillars, so assume that is the case unless you know otherwise.

Extending the real Factory is worth it when it is **not** final and you want to keep its other `create*()` methods and
override one:

```php
$this->swapModuleFactory(BlogFacade::class, new class() extends BlogFactory {   // BlogFactory must not be final
    public function createPostReader(): PostReader
    {
        return new InMemoryPostReader(['a post']);
    }
});
```

- `swapModuleFactory()`, `swapModuleConfig()` and `swapModuleProvider()` all take the **Facade** class: that is the
  name a consumer already knows, and the one the resolver derives a module's pillars from.
- Any object of the right pillar type works: a standalone `AbstractFactory`, an anonymous subclass of the real one, or
  a PHPUnit stub. The last two only where the class is not `final`.
- The swap survives repeated resolutions, and applies to a module that was already resolved earlier in the same test.
- Swapping the same module twice keeps the last double.
- Every swap is dropped by `resetContainer()`, which `GacelaTestCase` already runs in `tearDown()`, so the next test
  sees the real module again whatever order the suite runs in.

Naming a class that is not a Facade, the Factory itself or a typo, throws a `ModuleDoubleException` rather than
registering a double nothing would ever read.

This replaces reaching into `AnonymousGlobal::overrideExistingResolvedClass()`, which needed the resolver's key format
and left the Facade's memoised Factory in place.

## Module boundaries in a test method [since 2.4]

A boundary decision that lives only in CI configuration is one a module's own tests cannot state.
`Gacela\Console\Testing\ModuleAssertions` is a standalone trait, so it goes into whatever base test class a project
already has:

```php
use Gacela\Console\Testing\ModuleAssertions;

final class InvoiceBoundaryTest extends TestCase
{
    use ModuleAssertions;

    public function test_invoice_reaches_billing_and_customer_and_nothing_else(): void
    {
        Gacela::bootstrap(__DIR__);

        self::assertModuleDependsOnlyOn(InvoiceFacade::class, [BillingFacade::class, CustomerFacade::class]);
        self::assertNoModuleCycles(__DIR__ . '/allowed-cycles.json');
        self::assertModuleRulesHold(__DIR__ . '/module-rules.json');
    }
}
```

- `assertModuleDependsOnlyOn()` takes the module (any class inside it, its Facade by convention, or its namespace) and
  the modules it may reach. An allowance may name a namespace covering several modules. Naming a module the running
  configuration does not scan **fails**, listing the modules it did find, rather than passing on an empty dependency
  list.
- `assertNoModuleCycles()` reads the same allowed-cycles file `debug:graph --check --allowed-cycles` reads. An allowance
  whose cycle has since been broken fails too.
- `assertModuleRulesHold()` reads the same [`module-rules.json`](/docs/module-boundaries#declaring-which-modules-may-depend-on-which)
  the CLI and the PHPStan and Psalm rules read.

Every failure names the offending edge **and the `use` statement behind it**, as `file:line`:

```text
"App\Invoice" may depend only on:
  - App\Customer

✗ App\Invoice -> App\Billing
    /app/src/Invoice/Domain/InvoiceIssuer.php:12  use App\Billing\BillingFacade;
```

The line is where the `use` statement opens, so every name of a grouped import reports the same one. A dependency that
arrives without an import, such as a fully qualified name written inline or a class-string in configuration, has no
evidence to show, because the graph does not see it either.

The application must be bootstrapped, since these read the modules the running configuration declares. That is also
what makes [`bootstrapModule()`](#testing-one-module)'s narrowing useful here: inside a slice, these assertions answer
about one module.

The trait lives in `Gacela\Console`, not on `GacelaTestCase`, because the module graph is built by scanning source
files, which is console work, and `Gacela\Framework` does not depend on `Gacela\Console`. A test class writes
`use ModuleAssertions;` and has both.

## ContainerFixture

The trait provides helpers to reset, snapshot and restore the container state so tests don't bleed into each other. The
[module swap helpers](#replacing-another-module) above live here too, so they are available under either entry point.

### Setup

```php
use Gacela\Framework\Testing\ContainerFixture;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\TestCase;

final class MyTest extends TestCase
{
    use ContainerFixture;

    #[Before]
    protected function setUpContainer(): void
    {
        $this->resetContainer();
    }
}
```

### Available methods

| Method                                               | Description                                                                                                                                          |
|------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `resetContainer()`                                   | Wipe the container and all static caches. Clean slate for the next test                                                                              |
| `captureContainerState()`                            | Return a `ContainerSnapshot` of config values, application root, cache directory and the in-memory class-name cache (not resolved service instances) |
| `restoreContainerState(ContainerSnapshot $snapshot)` | Restore a snapshot previously returned by `captureContainerState()`                                                                                  |
| `containerTempDir()`                                 | Return a per-test temporary directory, removed at process shutdown (or synchronously via `cleanupContainerTempDirs()`)                               |

### Snapshot and restore

Use `captureContainerState()` / `restoreContainerState()` when a test mutates the container but subsequent assertions
need the original state:

```php
public function testServiceOverride(): void
{
    $snapshot = $this->captureContainerState();

    Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
        $config->addBinding(LoggerInterface::class, NullLogger::class);
    });

    // ... assertions with NullLogger ...

    $this->restoreContainerState($snapshot);

    // container is back to its pre-override state
}
```

`restoreContainerState()` puts back **every** field the snapshot captured: config values, application root and cache
directory as well as the class-name cache. Until 2.1 it restored only the class-name cache, which left
`Config::getInstance()` throwing after a restore. A snapshot taken before `Gacela::bootstrap()` restores nothing rather
than inventing a config instance the test never had, and restoring constructs no service object.

### Temporary directories

`containerTempDir()` returns a unique temporary directory for the current test. Use it for file-cache tests, artifact
storage, or anything that writes to disk:

```php
public function testFileCacheWrite(): void
{
    $cache = new FileCache($this->containerTempDir());
    $cache->put('key', 'value', ttl: 60);

    self::assertSame('value', $cache->get('key'));
    // temp dirs are removed at process shutdown; call cleanupContainerTempDirs() for synchronous per-test cleanup
}
```

## Test hygiene

- Prefer `resetContainer()` in a `#[Before]` method over `setUp()`. It makes the intent explicit and works alongside
  other `setUp` logic.
- For integration tests that need the full bootstrap, call `Gacela::bootstrap()` inside the test and `resetContainer()`
  in teardown.
- `ContainerFixture` replaces the older pattern of calling `$config->resetInMemoryCache()` inside `gacela.php` for
  tests.
