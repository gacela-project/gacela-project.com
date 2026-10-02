---
title: Testing
description: Test Gacela applications with isolated container state, temporary directories, and lifecycle-event assertions.
---

# Testing

Gacela ships two PHPUnit helpers: `GacelaTestCase`, the recommended base class for tests that bootstrap a Gacela app,
and `ContainerFixture`, the lower-level trait it builds on. PHPUnit is a suggested development dependency, not a Gacela
runtime dependency, so require it in your application to use these helpers.

## GacelaTestCase

`GacelaTestCase` extends PHPUnit's `TestCase`, uses the [`ContainerFixture`](#containerfixture) trait internally, and
handles teardown for you. Use `ContainerFixture` directly only when you can't extend this class.

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

You need no `#[Before]` or `resetContainer()` call. `bootstrapGacela()` / `bootstrapGacelaWithConfig()` reset the
in-memory cache before bootstrapping, and `tearDown()` resets the container and clears recorded events. State never
leaks between tests.

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
`assertServiceResolved()` and `assertBindingRegistered()` read Gacela's own lifecycle events (`ServiceResolvedEvent`
and `BindingRegisteredEvent`), recorded automatically from `bootstrapGacela()` onward. The [events catalog](/docs/events)
has the full list. For anything the two helpers don't cover, use `recordedGacelaEvents()` / `recordedGacelaEventsOf()`.
:::

### Asserting on recorded events

Use `recordedGacelaEventsOf()` for anything more specific than "was a service resolved", such as counting events or
reading a payload off one:

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

The everyday test in a modular application covers one module with its neighbours replaced. `bootstrapModule()` sets
that up in one call:

```php
$this->bootstrapModule(__DIR__, InvoiceFacade::class, doubles: [
    BillingFacade::class => $this->createStub(BillingFacade::class),
    PaymentGatewayInterface::class => new FakeGateway(),
]);

$invoice = (new InvoiceFacade())->issue('acme-nl', 10_000);
```

It does two things.

**It narrows discovery** to the Facade's directory. `doctor`, `list:modules` and `debug:graph` then report on that module
instead of the whole application. The narrowing applies after Gacela reads `gacela.php`, so an application that declares
its own `setAppModulePaths()` does not silently undo it.

**It applies each double through the seam that fits it**, so the test does not need to know which seam a dependency
arrives on:

| The double is                                                            | It becomes                                                                                                    |
|--------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| an `AbstractFactory`, `AbstractConfig` or `AbstractProvider` instance    | that pillar of the module its key's **Facade** names, as with the `swapModule*()` calls below                  |
| any other object, keyed by a class or interface                          | a container binding, a lazy service, a binding scoped to the module's pillars, and a resolved-class override   |
| a `Closure` or a class-string, keyed by a class or interface             | a container binding, a lazy service, and a binding scoped to the module's pillars                              |
| anything, keyed by a **container id**                                    | a replacement for that id wherever it is registered, including in the module's own Provider                     |

The binding scoped to the module's pillars wins over a class that `gacela.php` binds for the same type. Every class
outside the module keeps what `gacela.php` declares.

The fourth argument, `configFn`, is a `GacelaConfig` closure. It adds to the narrowing instead of replacing it:

```php
$this->bootstrapModule(__DIR__, InvoiceFacade::class,
    doubles: [BillingFacade::class => $billing],
    configFn: static fn (GacelaConfig $config) => $config->addExternalService('clock', $frozenClock),
);
```

Like `bootstrapGacela()`, it bootstraps once per test, and `tearDown()` drops everything it registered.

- **A neighbour has to leave its Facade open.** You cannot hand a stand-in to a consumer that type-hints a `final`
  Facade. Where the Facade must stay `final`, replace the neighbour's Factory instead.
- **A double must be an instance of what it is registered under.** Otherwise a `ModuleDoubleException` refuses it,
  instead of a failure at the consumer that type-hints the real one.
- **Gacela does not check whether the module depends on the doubled class.** Reflection cannot see every way a module
  reaches a dependency, so such a check would refuse legitimate tests.

The [upstream testing guide](https://github.com/gacela-project/gacela/blob/main/docs/testing.md#testing-one-module-bootstrapmodule)
covers the routing in more depth.

## Replacing another module [since 2.2]

To test module A in isolation, you replace module B. A container binding works only when B's Facade arrives through a
Provider. A consumer that writes `new BlogFacade()` leaves nothing to bind. So the seam is the **Factory** every Facade
resolves:

```php
$this->swapModuleFactory(BlogFacade::class, new class() extends AbstractFactory {
    public function createPostReader(): PostReader
    {
        return new InMemoryPostReader(['a post']);
    }
});

(new CheckoutFacade())->summary();  // reaches the double, not the real Blog
```

The double extends `AbstractFactory`, not `BlogFactory`. It needs only the methods the Facade under test calls:
`swapModuleFactory()` takes an `AbstractFactory`, so the double does not have to be Blog's own class.

**If `BlogFactory` is `final`, this is the only form available.** PHP cannot subclass a `final` class (it raises a fatal
error), and PHPUnit cannot double one (`ClassIsFinalException`). Neither `new class() extends BlogFactory` nor
`$this->createStub(BlogFactory::class)` runs. `make:module` generates `final` pillars, so assume your Factory is `final`
unless you know otherwise.

Extend the real Factory when it is **not** final and you want to keep its other `create*()` methods and override one:

```php
$this->swapModuleFactory(BlogFacade::class, new class() extends BlogFactory {   // BlogFactory must not be final
    public function createPostReader(): PostReader
    {
        return new InMemoryPostReader(['a post']);
    }
});
```

- `swapModuleFactory()`, `swapModuleConfig()` and `swapModuleProvider()` all take the **Facade** class. A consumer
  already knows that name, and the resolver derives a module's pillars from it.
- Any object of the right pillar type works: a standalone `AbstractFactory`, an anonymous subclass of the real one, or
  a PHPUnit stub. The last two work only when the class is not `final`.
- The swap survives repeated resolutions, and applies to a module already resolved earlier in the same test.
- Swapping the same module twice keeps the last double.
- `resetContainer()` drops every swap. `GacelaTestCase` already runs it in `tearDown()`, so the next test sees the real
  module again, whatever order the suite runs in.

Naming a class that is not a Facade (the Factory itself, or a typo) throws a `ModuleDoubleException` instead of
registering a double nothing would ever read.

This replaces reaching into `AnonymousGlobal::overrideExistingResolvedClass()`, which needed the resolver's key format
and left the Facade's memoised Factory in place.

## Module boundaries in a test method [since 2.4]

When a boundary decision lives only in CI configuration, a module's own tests cannot state it.
`Gacela\Console\Testing\ModuleAssertions` is a standalone trait, so you can add it to any base test class you already
have:

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
  the modules it may reach. An allowance may name a namespace that covers several modules. If you name a module the
  running configuration does not scan, the assertion **fails** and lists the modules it found. It does not pass on an
  empty dependency list.
- `assertNoModuleCycles()` reads the same allowed-cycles file as `debug:graph --check --allowed-cycles`. An allowance
  whose cycle is already broken fails too.
- `assertModuleRulesHold()` reads the same [`module-rules.json`](/docs/module-boundaries#declaring-which-modules-may-depend-on-which)
  as the CLI and the PHPStan and Psalm rules.

Every failure names the offending edge **and the `use` statement behind it**, as `file:line`:

```text
"App\Invoice" may depend only on:
  - App\Customer

✗ App\Invoice -> App\Billing
    /app/src/Invoice/Domain/InvoiceIssuer.php:12  use App\Billing\BillingFacade;
```

The line is where the `use` statement opens, so every name in a grouped import reports the same line. A dependency
without an import, such as an inline fully qualified name or a class-string in configuration, has no evidence to show:
the graph does not see it either.

Bootstrap the application first, since these assertions read the modules the running configuration declares. That is
also why [`bootstrapModule()`](#testing-one-module)'s narrowing helps here: inside a slice, these assertions report on
one module.

The trait lives in `Gacela\Console`, not on `GacelaTestCase`. Building the module graph means scanning source files,
which is console work, and `Gacela\Framework` does not depend on `Gacela\Console`. A test class writes
`use ModuleAssertions;` and has both.

## ContainerFixture

The trait resets, snapshots and restores the container state, so tests don't bleed into each other. The
[module swap helpers](#replacing-another-module) above live here too, so both entry points have them.

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

Use `captureContainerState()` / `restoreContainerState()` when a test changes the container but later assertions need
the original state:

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

`restoreContainerState()` puts back **every** field the snapshot captured: config values, application root, cache
directory and the class-name cache. Until 2.1 it restored only the class-name cache, which left `Config::getInstance()`
throwing after a restore. A snapshot taken before `Gacela::bootstrap()` restores nothing, instead of inventing a config
instance the test never had. Restoring constructs no service object.

### Temporary directories

`containerTempDir()` returns a unique temporary directory for the current test. Use it for file-cache tests, artifact
storage, or anything else that writes to disk:

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

- Prefer `resetContainer()` in a `#[Before]` method over `setUp()`. It states the intent and works alongside other
  `setUp` logic.
- For integration tests that need the full bootstrap, call `Gacela::bootstrap()` inside the test and `resetContainer()`
  in teardown.
- `ContainerFixture` replaces the older pattern of calling `$config->resetInMemoryCache()` inside `gacela.php` for
  tests.
