# Static analysis

Gacela ships PHPStan rules, Psalm configuration, and a 2.0 Psalm plugin for dynamic pillar accessors and module architecture.

## PHPStan

Include in your `phpstan.neon`:

```neon
includes:
    - vendor/gacela-project/gacela/phpstan-gacela.neon
```

`phpstan-gacela.neon` types declared accessors and enables architectural rules:

- **Naming conventions** — a `Facade` / `Factory` / `Provider` / `Config` class must extend the matching Gacela abstract (`SuffixExtendsRule`).
- **`FacadeOnlyDelegatesRule`** — a Facade only delegates to its Factory instead of holding business logic.
- **`FactoryDoesNotCallFacadeRule`** — a Factory never calls back into a Facade.
- **`CrossModuleViaFacadeRule`** — opt-in (commented out in the shipped config): enforces that modules communicate only through Facades. See [Enforcing module boundaries](#enforcing-module-boundaries).

### Typed pillar accessors

`#[ServiceMap]` gives a magic accessor a real return type:

```php
#[ServiceMap(method: 'getFacade', className: CheckoutFacade::class)]
final class CheckoutController
{
    use ServiceResolverAwareTrait;

    public function __invoke(): Response
    {
        return $this->getFacade()->placeOrder();
    }
}
```

PHPStan now checks `placeOrder()` and every call reached through the Facade. A native `@method CheckoutFacade getFacade()` annotation is also understood, though the attribute remains the forward-compatible runtime declaration.

### Typed provided dependencies

The class-string form of `getProvidedDependency()` returns the named type:

```php
$clock = $this->getProvidedDependency(Clock::class); // inferred as Clock
```

A plain string key still returns `mixed` because no type is encoded in the key. Factories themselves may also declare constructor dependencies; pillar construction goes through the container and is autowired:

```php
final class CheckoutFactory extends AbstractFactory
{
    public function __construct(private readonly Clock $clock) {}
}
```

### Facade interfaces

`FacadeInterfaceInSyncRule` is enabled by default for a `FooFacade` that explicitly implements `FooFacadeInterface`. It reports public Facade methods missing from that interface, preventing consumers typed against the interface from silently seeing a smaller API. Facades with no matching interface are ignored.

### Enforcing module boundaries

`CrossModuleViaFacadeRule` ships commented out in `phpstan-gacela.neon`. Uncomment it and pass your namespaces to enable it:

```neon
services:
    -
        class: Gacela\PHPStan\Rules\CrossModuleViaFacadeRule
        tags: [phpstan.rules.rule]
        arguments:
            rootNamespace: App\Modules
            modulePathSegments: 1
            sharedNamespaces:
                - App\Modules\Shared
```

- `rootNamespace` (string, required) — your project's module root, e.g. `App\Modules`.
- `modulePathSegments` (int, default `1`) — how many namespace segments beneath the root identify a single module.
- `sharedNamespaces` (list of strings, default `[]`, since 1.18.0) — shared kernels exempt from the boundary: references *into* them are always allowed, and classes *inside* them aren't checked.

The rule covers construction, static calls, class constants, and static properties. Namespace matching respects boundaries, so `App\Modules\Shared` does not accidentally exempt `App\Modules\SharedFoo`.

### Dependency cycles and graph review

Use the CLI graph as an architecture gate:

```bash
vendor/bin/gacela debug:graph --check
```

Reviewed cycles can be recorded with a required reason:

```json
[
    {
        "modules": ["App\\Billing", "App\\Invoicing"],
        "reason": "Reviewed temporary boundary while extracting a shared kernel"
    }
]
```

```bash
vendor/bin/gacela debug:graph --check --allowed-cycles=allowed-module-cycles.json
```

The allowlist is self-invalidating: an entry that no longer matches a real cycle fails, preventing stale exceptions from becoming permanent mute buttons.

To make architecture changes visible in a pull request, save JSON on the base branch and compare it on the feature branch:

```bash
vendor/bin/gacela debug:graph --format=json > base-graph.json
vendor/bin/gacela debug:graph --compare-to=base-graph.json > graph-diff.md
```

The diff is GitHub-flavored Markdown with a Mermaid diagram. An unchanged graph writes nothing and exits successfully; an unreadable or invalid baseline exits non-zero.

Accurate module return types across `getFactory()`, `getConfig()` and `getProvidedDependency()` come from the `@template` annotations on Gacela's abstract classes plus the `@extends` on your concrete module classes — independent of this config.

::: warning Changed in 2.0
The fallback suppression for an undeclared `getFacade()`-style accessor is gone. Add `#[ServiceMap]` or a native `@method` annotation; otherwise PHPStan correctly reports an undefined method. Declaring the return type also lets analysis catch errors on everything called through the accessor.
:::

## Psalm

```xml
<?xml version="1.0"?>
<psalm
    xmlns:xi="http://www.w3.org/2001/XInclude"
    xmlns="https://getpsalm.org/schema/config"
>
    <projectFiles>
        <directory name="src"/>
    </projectFiles>

    <plugins>
        <pluginClass class="Gacela\Psalm\Plugin"/>
    </plugins>

    <xi:include href="vendor/gacela-project/gacela/psalm-gacela.xml"/>

    <issueHandlers>
        <InvalidArgument>
            <errorLevel type="suppress">
                <directory name="src" />
            </errorLevel>
        </InvalidArgument>
    </issueHandlers>
</psalm>
```

The `InvalidArgument` suppression is required because Gacela resolves concrete types at runtime that Psalm can't infer statically. Suppress inline if you prefer narrower scope:

```php
/** @psalm-suppress InvalidArgument */
return new YourService($this->getConfig());
```

The plugin reads `#[ServiceMap(method: 'getFacade', className: MyFacade::class)]` and gives the magic accessor its real return type. Without it, `psalm-gacela.xml` can suppress the undefined magic call but the result becomes `mixed`, disabling checks on subsequent method calls.

The plugin cannot be delivered by the XInclude because `<plugins>` belongs elsewhere in the Psalm document, so the explicit block is required.

## Troubleshooting

- **PHPStan can't find the file**: verify the include path resolves relative to your `phpstan.neon`.
- **Psalm ignores the include**: ensure `xmlns:xi="http://www.w3.org/2001/XInclude"` is declared, then `vendor/bin/psalm --clear-cache`.

## See also

- [PHPStan: ignoring errors](https://phpstan.org/user-guide/ignoring-errors)
- [Psalm configuration](https://psalm.dev/docs/running_psalm/configuration/)
- [Gacela `#[ServiceMap]`](/docs/service-map)
