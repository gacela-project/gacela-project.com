---
title: Static analysis
description: The Gacela architecture rules, shipped with the framework and run identically under PHPStan and Psalm.
---

# Static analysis

Gacela's architecture is a set of claims: a Facade only delegates, a Factory wires its own module, module A reaches
module B only through B's Facade. Those claims are worth no more than what checks them, so the checks ship **with the
framework**, for PHPStan and Psalm alike.

Both analysers run the same rules. There is one implementation of each check in `Gacela\StaticAnalysis`;`Gacela\PHPStan`
and `Gacela\Psalm` are thin adapters over it. The two cannot drift apart on what counts as a violation, and neither can
fall behind the framework it checks. See [why the rules ship here](#why-the-rules-ship-with-the-framework).

::: info New in 2.1
Before 2.1 the rules were PHPStan-only and Psalm did nothing but type the pillar accessors. Every rule now reports under
Psalm too, as its own suppressible issue class.
:::

## Setup

### PHPStan

With [phpstan/extension-installer](https://github.com/phpstan/extension-installer) there is nothing to do: requiring
Gacela registers the rules and the accessor typing. [since 2.2] Turn that off for this package alone with:

```json
{
    "extra": {
        "phpstan/extension-installer": {
            "ignore": ["gacela-project/gacela"]
        }
    }
}
```

Without the installer, include it yourself:

```neon
includes:
    - vendor/gacela-project/gacela/phpstan-gacela.neon
```

### Psalm [since 2.1]

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
        <directory name="src"/>
      </errorLevel>
    </InvalidArgument>
  </issueHandlers>
</psalm>
```

The `InvalidArgument` suppression is required: Gacela resolves concrete types at runtime that Psalm can't infer
statically. Suppress inline if you prefer narrower scope:

```php
/** @psalm-suppress InvalidArgument */
return new YourService($this->getConfig());
```

The `<plugins>` block cannot be delivered through the XInclude, because XInclude replaces a single element and
`<plugins>` lives elsewhere in your config. It is also the part that matters: `psalm-gacela.xml` only *suppresses*
`UndefinedMagicMethod`, and a suppressed call is not a checked one. The plugin replaces the suppression with real types.

## What is checked

Each rule reports under a PHPStan error identifier and a Psalm issue class. Both are what you suppress on, so a rule can
be turned off on its own.

| Check                                                                                         | PHPStan identifier                 | Psalm issue                      |        |
|-----------------------------------------------------------------------------------------------|------------------------------------|----------------------------------|--------|
| `*Facade` / `*Factory` / `*Provider` / `*Config` extends its pillar base                      | `gacela.suffixExtends`             | `GacelaSuffixExtends`            | on     |
| A Facade method only delegates                                                                | `gacela.facadeOnlyDelegates`       | `GacelaFacadeOnlyDelegates`      | on     |
| A Factory does not `new` a Facade                                                             | `gacela.factoryInstantiatesFacade` | `GacelaFacadeInstantiation`      | on     |
| A Factory does not call `$this->getFacade()`                                                  | `gacela.factoryCallsGetFacade`     | `GacelaFactoryFacadeAccess`      | on     |
| A Facade's public methods are in its `*FacadeInterface`                                       | `gacela.facadeInterfaceDrift`      | `GacelaFacadeInterfaceDrift`     | on     |
| A `#[Cacheable]` method reaches `$this->cached()` [since 2.3]                                  | `gacela.cacheableWithoutCachedCall` | `GacelaCacheableWithoutCachedCall` | on   |
| A `#[Cacheable]` key mentions the arguments [since 2.3]                                        | `gacela.cacheableKeyIgnoresArguments` | `GacelaCacheableKeyIgnoresArguments` | on |
| A cross-module reference the source **names**                                                 | `gacela.crossModuleWithoutFacade`  | `GacelaCrossModuleAccess`        | opt-in |
| A cross-module call the source does **not** name                                              | `gacela.crossModuleMethodCall`     | `GacelaCrossModuleMethodCall`    | opt-in |
| A dependency the project's [rules file](/docs/module-boundaries#declaring-which-modules-may-depend-on-which) forbids | `gacela.declaredModuleDependency`  | `GacelaDeclaredModuleDependency` | opt-in |
| A pillar accessor declared with `#[ServiceMap]`, not `@method` [since 2.3]                     | `gacela.serviceMapMissing`         | `GacelaServiceMapMissing`        | opt-in |

On top of the rules, both analysers gain two **types** they otherwise lack:
the [pillar accessors](#typed-pillar-accessors), and [`getProvidedDependency()`](#typed-provided-dependencies) by
class-string.

Every finding carries the correction as well as the complaint. [since 2.1] PHPStan renders it on its own 💡 line; Psalm appends it to
the message, because it has nowhere else to put it:

```text
Class App\Checkout\CheckoutFacade should extend Gacela\Framework\AbstractFacade
    💡 Extend Gacela\Framework\AbstractFacade, or rename it so it does not end in Facade.
```

The pillar rules apply to **classes**. An interface, trait or enum named after a pillar is left alone: none of them can
extend a class, so there would be no way to act on the report.

Suppressing one rule:

```neon
# phpstan.neon
parameters:
    ignoreErrors:
        -
            identifier: gacela.suffixExtends
            path: src/Legacy/*
```

```xml
<!-- psalm.xml -->
<issueHandlers>
  <PluginIssue name="GacelaSuffixExtends">
    <errorLevel type="suppress">
      <directory name="src/Legacy"/>
    </errorLevel>
  </PluginIssue>
</issueHandlers>
```

## Typed pillar accessors

Declare the pillar with `#[ServiceMap]` and the accessor gets a real return type under both analysers:

```php
#[ServiceMap(method: 'getFacade', className: CheckoutFacade::class)]
final class CheckoutController
{
    use ServiceResolverAwareTrait;

    public function __invoke(): Response
    {
        // Both analysers know this is a CheckoutFacade, and check the call on it.
        return $this->getFacade()->placeOrder();
    }
}
```

This matters more than it looks. The accessor was previously *suppressed* rather than typed, and a suppressed call is
not a checked one: it evaluates to `mixed`, which silently switches off analysis of everything reached through it, not
just the accessor itself. A typo in `placeOrder()` produced no error at all.

A `@method CheckoutFacade getFacade()` docblock works too, since both analysers read those natively, but then the same
fact is written twice and the copies drift.

::: warning Declare every dynamic accessor
**The PHPStan suppression is gone as of 2.0.** `phpstan-gacela.neon` no longer carries an `ignoreErrors` entry for
undeclared pillar accessors, so a class that declares neither `#[ServiceMap]` nor a `@method` docblock has its
`$this->getFacade()` reported as an undefined method. Psalm still ships its suppression in `psalm-gacela.xml` as a
fallback, scheduled for removal in 3.0.
:::

## Typed provided dependencies

Ask for a provided dependency by class-string and it comes back typed, under PHPStan and, as of 2.1, under Psalm:

```php
// Both analysers know this is a Clock, and check the call on it.
$clock = $this->getProvidedDependency(Clock::class);
```

`getProvidedDependency()` is declared as returning `mixed`, which is why call sites end up with a hand-written `@var`
above them: an assertion the analyser takes on faith, and which keeps claiming the old type after the Provider changes.
When the key *is* a class-string, the type was never unknown; it was discarded at the boundary.

A string key (`$this->getProvidedDependency('some.service')`) still returns `mixed`. Nothing in the type system says
what it resolves to, and a guess would be worse than `mixed`: `mixed` is honestly unknown, a guess is confidently wrong
and then trusted.

A Factory may also declare its dependencies in its **constructor**; pillars are resolved through the container, so
autowiring applies to the Factory itself:

```php
final class CheckoutFactory extends AbstractFactory
{
    public function __construct(
        private readonly Clock $clock,
    ) {
    }
}
```

## Facade interfaces

If you type-hint against a `*FacadeInterface` rather than the concrete Facade, the interface-drift rule keeps the pair
honest: a public Facade method missing from the interface is reported.

Only that direction can drift. PHP already rejects a class that fails to implement an interface method, so the interface
cannot gain a method the Facade lacks. But the Facade grows public methods the interface never hears about, and
consumers holding the interface silently cannot reach them. That stays invisible until someone compares the two files,
and by then the fix is a breaking change.

The rule is on by default and self-limiting: it only fires for a Facade that explicitly implements the interface named
after it (`FooFacade` implements `FooFacadeInterface`). A Facade that implements unrelated interfaces, or none, is not
checked.

## Cacheable methods that do not cache [since 2.3]

Two rules cover [`#[Cacheable]`](/docs/cacheable-methods), where the failure is silent by construction: the code runs,
returns the right value, and caches nothing or caches the wrong thing.

**The attribute is metadata, not a mechanism.** `cached()` reads it. A method carrying `#[Cacheable]` whose body never
reaches `$this->cached()` is simply not cached:

```text
App\User\UserFacade::profile() carries #[Cacheable] and never calls
$this->cached(), so nothing caches it: the attribute is metadata
that `cached()` reads.
    💡 Wrap the body in $this->cached(fn () => ...), or call a helper that does.
```

The rule judges the **class**, not the method on its own, because `cached()` may live in a private helper the method
delegates to.

**A key with no placeholder is one key.** `#[Cacheable(key: 'user')]` on a method that takes an argument produces the
same string for every call, so `getUser(2)` is answered with user 1's row:

```text
The #[Cacheable] key "user" on App\User\UserFacade::getUser() does not
mention the arguments, so every call shares one entry and the first
result is served to all of them
    💡 Put the argument in the key, as "user:{0}", or drop `key` so
       the trait derives one from the arguments.
```

Placeholders pointing past the arguments are reported the same way. One in range is enough, and a variadic is not
judged on its index.

Both rules are on by default.

## Finding what 3.0 removes [since 2.3]

`gacela.serviceMapMissing` reports a pillar accessor still resolved from a `@method` docblock, which is the resolution
3.0 drops. It names the `#[ServiceMap]` to paste:

```text
App\Wallet\WalletCommand::getFacade() is resolved from its @method
docblock, which is deprecated and removed in 3.0
    💡 Declare it with #[ServiceMap(method: 'getFacade',
       className: WalletFacade::class)].
```

It is off by default, because a `@method` accessor is not wrong on 2.x. Turning it on is the decision to start the
migration, taken when the project is ready rather than as a side effect of upgrading:

```neon
# phpstan.neon
services:
    -
        class: Gacela\PHPStan\Rules\ServiceMapMissingRule
        tags: [phpstan.rules.rule]
```

```xml
<!-- psalm.xml -->
<pluginClass class="Gacela\Psalm\Plugin">
  <serviceMapMissing/>
</pluginClass>
```

See [Service Map](/docs/service-map) for the attribute, and [Upgrading](/docs/upgrading) for what 3.0 changes.

## Module boundaries

The two opt-in cross-module rules, the dependency-cycle gate on `debug:graph`, the declared module rules file, and the
CI graph review have their own page: [Module boundaries](/docs/module-boundaries). Enable the rules there once the
analyser setup above is in place.

## Why the rules ship with the framework

Rather than as separate `phpstan-extension` / `psalm-plugin` packages, which is the more usual arrangement. Three
reasons, and one piece of evidence.

**One implementation per rule.** `Gacela\StaticAnalysis` holds the checks; `Gacela\PHPStan` and `Gacela\Psalm` adapt
them to a host. Split the adapters into separate packages and that shared core has to live somewhere: back here anyway,
in a third package, or duplicated. Two copies of "what counts as the same module" would drift, which is the failure the
interface-drift rule exists to catch.

**Gacela analyses itself with them.** `phpstan.neon` includes `phpstan-gacela.neon` and `psalm.xml` registers the
plugin, so every rule runs against the framework's own source on every build. Separate packages make that a circular
dependency, and a rule nobody runs is a rule nobody notices breaking.

**Lockstep is the point.** These rules name `AbstractFacade`, `AbstractFactory` and the rest. They are a description of
this framework's architecture at this version, not a general-purpose tool with its own release cycle.

**The evidence:** `gacela-project/phpstan-extension` was that separate package. It stopped at PHPStan 1, builds errors
without the identifiers PHPStan 2 requires, and so cannot load against the PHPStan version Gacela itself needs. Its one
rule now lives here as `CrossModuleMethodCallRule`.

## Migrating from `gacela-project/phpstan-extension`

That package is abandoned, and 2.1 drops it from Gacela's `suggest` list. Everything it did is built in, and more.

```bash
composer remove --dev gacela-project/phpstan-extension
```

| `phpstan-extension`                            | Built in                                       |
|------------------------------------------------|------------------------------------------------|
| `includes: …/phpstan-extension/extension.neon` | `includes: …/gacela/phpstan-gacela.neon`       |
| `parameters.gacela.modulesNamespace`           | `rootNamespace`, on the two cross-module rules |
| `parameters.gacela.excludedNamespaces`         | `sharedNamespaces`, on the same two rules      |

Its `EnforceModuleBoundariesForMethodCallRule` is `CrossModuleMethodCallRule` here, and the boundary check now has a
second half, the references a source names, that the package never covered.
See [Module boundaries](/docs/module-boundaries) for the configuration.

## Troubleshooting

- **PHPStan can't find the file**: verify the include path resolves relative to your `phpstan.neon`.
- **Psalm ignores the include**: ensure `xmlns:xi="http://www.w3.org/2001/XInclude"` is declared, then
  `vendor/bin/psalm --clear-cache`.
- **A rule fires on the framework's own words**: `GacelaConfig` is a bootstrap builder, not a pillar. `psalm.xml` and
  `phpstan.neon` in the Gacela repository show the scoped suppression.

Accurate module return types across `getFactory()`, `getConfig()` and `getProvidedDependency()` also come from the
`@template` annotations on Gacela's abstract classes plus the `@extends` on your concrete module classes, independent of
this configuration.

## See also

- [Module boundaries](/docs/module-boundaries): the cross-module rules, cycle gate, and rules file
- [PHPStan: ignoring errors](https://phpstan.org/user-guide/ignoring-errors)
- [Psalm configuration](https://psalm.dev/docs/running_psalm/configuration/)
- [Gacela `#[ServiceMap]`](/docs/service-map)
