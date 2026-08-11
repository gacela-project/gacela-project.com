---
title: Static analysis
---
# Static analysis

Gacela ships configs for PHPStan and Psalm that suppress false positives from dynamic resolution via `#[ServiceMap]` attributes and the magic `getFacade()` / `getFactory()` / `getConfig()` dispatch.

## PHPStan

Include in your `phpstan.neon`:

```neon
includes:
    - vendor/gacela-project/gacela/phpstan-gacela.neon
```

Beyond the suppressions, `phpstan-gacela.neon` also enables architectural rules:

- **Naming conventions** — a `Facade` / `Factory` / `Provider` / `Config` class must extend the matching Gacela abstract (`SuffixExtendsRule`).
- **`FacadeOnlyDelegatesRule`** — a Facade only delegates to its Factory instead of holding business logic.
- **`FactoryDoesNotCallFacadeRule`** — a Factory never calls back into a Facade.
- **`CrossModuleViaFacadeRule`** — opt-in (commented out in the shipped config): enforces that modules communicate only through Facades. See [Enforcing module boundaries](#enforcing-module-boundaries).

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

Accurate module return types across `getFactory()`, `getConfig()` and `getProvidedDependency()` come from the `@template` annotations on Gacela's abstract classes plus the `@extends` on your concrete module classes — independent of this config.

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

## Troubleshooting

- **PHPStan can't find the file**: verify the include path resolves relative to your `phpstan.neon`.
- **Psalm ignores the include**: ensure `xmlns:xi="http://www.w3.org/2001/XInclude"` is declared, then `vendor/bin/psalm --clear-cache`.

## See also

- [PHPStan: ignoring errors](https://phpstan.org/user-guide/ignoring-errors)
- [Psalm configuration](https://psalm.dev/docs/running_psalm/configuration/)
- [Gacela `#[ServiceMap]`](/docs/1.x/service-map)
