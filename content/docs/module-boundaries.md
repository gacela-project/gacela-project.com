---
title: Module boundaries
description: Enforce module boundaries with cross-module rules, a dependency-cycle gate, a declared rules file, and a CI graph review.
---

# Module boundaries

Module A may only reach module B through B's Facade. This page collects everything that enforces that claim and the
agreements built on top of it: two opt-in analyser rules, a dependency-cycle gate on [`debug:graph`](/docs/cli#debug-graph),
a declared rules file both readers share, and a CI review for graph changes.

The rules run under PHPStan and Psalm alike; [Static analysis](/docs/static-analysis) covers installing the analysers,
the always-on pillar rules, and suppression.

## The cross-module rules

This is the one check that cannot be on by default: nothing in a class name says where a module boundary falls, so it
needs your root namespace.

It comes in **two halves, meant to be enabled together**.

The first matches the module names a source *writes*: a `new`, a static call, a class constant, a static property. The
second, new in 2.1, resolves the receiver of a method call by **type**, because that is how a boundary actually gets
crossed once dependencies go through Providers and constructors:

```php
public function __construct(
    private readonly InvoiceRepository $invoices,  // App\Billing: another module
) {
}

public function createProcessor(): Processor
{
    return new Processor($this->invoices->findAll());  // names nothing here
}
```

The class appears once, in a type-hint. A check that only matched written names would report green on exactly the
codebases most likely to be crossing boundaries.

### PHPStan

Both rules ship commented out in `phpstan-gacela.neon`. Register them with your namespaces:

```neon
services:
    -
        class: Gacela\PHPStan\Rules\CrossModuleViaFacadeRule
        tags: [phpstan.rules.rule]
        arguments:
            rootNamespace: App\Modules
            modulePathSegments: 1     # how many segments under the root identify a module
            sharedNamespaces:         # optional shared kernels, exempt from the check
                - App\Modules\Shared
    -
        class: Gacela\PHPStan\Rules\CrossModuleMethodCallRule
        tags: [phpstan.rules.rule]
        arguments:
            rootNamespace: App\Modules
            modulePathSegments: 1
            sharedNamespaces:
                - App\Modules\Shared
```

### Psalm [since 2.1]

One `<crossModule>` element enables both halves:

```xml

<plugins>
  <pluginClass class="Gacela\Psalm\Plugin">
    <crossModule rootNamespace="App\Modules" modulePathSegments="1">
      <sharedNamespace>App\Modules\Shared</sharedNamespace>
    </crossModule>
  </pluginClass>
</plugins>
```

A `<crossModule>` without a `rootNamespace` is a configuration error and stops the run. A rule that quietly does nothing
is worse than no rule: it reads as a green check, and nothing would ever tell you the boundary went unchecked.

### What it accepts

- `sharedNamespaces` entries are exempt in both directions: references into them are always allowed, and classes inside
  them are not checked. Matching is namespace-boundary aware, so `App\Modules\Shared` does not exempt
  `App\Modules\SharedFoo`.
- A **call** on a `*Facade` or a `*FacadeInterface` is allowed; consumers type-hint the interface, which is the same
  sanctioned crossing. A **written reference** is allowed only for `*Facade`, because naming`SomeFacadeInterface::class`
  is not a call through one.
- A receiver the analyser cannot resolve is not reported. An unknown type is not evidence of a violation, and guessing
  there would make the rule noise.
- One line can produce two findings. `(new ShopService())->run()` both names the other module and calls into it: two
  crossings with two corrections, so both are reported.

To see the actual module dependency graph of your app, run [`debug:graph`](/docs/cli#debug-graph).

## What a module exports [since 2.4]

A module's public surface is wider than its Facade. DTOs, enums, value objects, events and plugin contracts: a Facade
that returns an invoice has published the invoice too, and reading it in another module is what it was returned for.
Both cross-module rules leave that surface alone. There are two ways to declare it, read the same way by both analysers.

### `#[PublicApi]`

```php
use Gacela\Framework\Attribute\PublicApi;

#[PublicApi]
final class InvoiceRecord
{
    // ...
}
```

It works on classes, interfaces and enums, declared where the class already lives. It is **not inherited**: publishing
a base class would publish everything anyone ever extends from it, so mark each exported type. Classes written by
[`dto:generate`](/docs/cli#dto-generate) carry it already.

### The namespace convention

A list of sub-namespace **segment names**, by default `Shared`, `Transfer`, `Dto` and `Event`, that a module publishes
by construction. `App\Billing\Shared\Invoice` and `App\Billing\Domain\Dto\Money` are both exported with no
annotation. Segments are matched whole, at any depth, never as prefixes: `Event` publishes `App\Billing\Event\` and
leaves `App\Billing\EventHandler\` alone. A class sitting directly in its module is never published by the convention.

Configure it on both cross-module rules:

|                 | PHPStan                             | Psalm                                    |
|-----------------|-------------------------------------|------------------------------------------|
| Configured with | `publicApiSegments:` (a list)       | `<publicApiSegment>` (one element each)  |
| Left out        | the default list applies            | the default list applies                 |
| Turned off      | an explicit `publicApiSegments: []` | a single empty `<publicApiSegment/>`     |

This is not the same idea as `sharedNamespaces`. A shared namespace is a fully qualified prefix that belongs to no
module, exempt in both directions. A public API segment is a sub-namespace under each module, and a class in one still
belongs to the module that owns it.

### Reading the surface back

[`debug:module Billing`](/docs/cli#debug-module) prints a `Public API` section listing what the module exports,
attribute-declared and convention-matched together, or `(none)`. The `--json` document carries it under `publicApi`.

### What it does not do

Publishing a class says it may be touched **without going through the Facade**. It does not say two modules may be
coupled at all: that is what [the declared rules file](#declaring-which-modules-may-depend-on-which) answers, and
`DeclaredModuleDependencyRule` is deliberately not exempted by `#[PublicApi]`. `debug:graph --check` enforces the same
rules file from `use` imports and cannot see an attribute, so exempting in the analyser alone would leave the editor
green and CI red on the same line.

## Failing on dependency cycles

`debug:graph --check` exits non-zero when two modules depend on each other:

```bash
vendor/bin/gacela debug:graph --check
```

A cycle is either a decision somebody made or a mistake nobody noticed, and until the decision is written down those are
the same thing. Write it down in a JSON file and pass it in:

```json
[
  {
    "modules": [
      "App\\Billing",
      "App\\Invoicing"
    ],
    "reason": "reviewed 2026-07: bidirectional by design until the shared kernel lands"
  }
]
```

```bash
vendor/bin/gacela debug:graph --check --allowed-cycles=allowed-module-cycles.json
```

The allow list is **self-invalidating**: an entry that no longer matches a real cycle fails the check just as loudly as
an undeclared cycle. That is deliberate. An allow list that outlives what it allows stops being a record of a decision
and becomes a mute button, and nothing would tell you it had happened. A `reason` is required for the same reason: an
allowance nobody justified is indistinguishable from a cycle nobody noticed.

`debug:graph` with no `--check` stays exit-code-neutral, so adding the gate does not change what the command already
did.

## Declaring which modules may depend on which [since 2.2]

A cycle is the only thing the graph can refuse on its own. Everything else a team agrees on, billing must not reach
back-office, reporting reads and nothing more, lives in prose, where no tool can see it and a violation arrives as one
more import in a diff. Write it in a JSON file instead:

```json
{
    "rules": [
        {
            "from": "App\\Payment",
            "deny": ["App\\Admin"],
            "reason": "reviewed 2026-08: billing must not reach back-office"
        },
        {
            "from": "App\\Reporting",
            "allow": ["App\\Shared"],
            "reason": "read-only module: the shared kernel and nothing else"
        }
    ]
}
```

- `deny` forbids the listed modules and leaves every other dependency alone.
- `allow` is the opposite reading: those are the **only** modules reachable, and anything else is a violation. An
  empty `allow` is meaningful: a leaf module that may depend on nothing.
- One entry cannot carry both, and a rule with no `reason` is refused.
- A rule about `App\Payment` also governs `App\Payment\Refunds`, and matching is namespace-boundary aware:
  `App\Pay` never governs `App\Payment`.

The same file is read in two places. In CI, over the whole graph:

```bash
vendor/bin/gacela debug:graph --check --rules=module-rules.json
```

and in the editor, per class, by whichever analyser you run:

```neon
# phpstan.neon
services:
    -
        class: Gacela\PHPStan\Rules\DeclaredModuleDependencyRule
        tags: [phpstan.rules.rule]
        arguments:
            rootNamespace: App
            rulesFile: %currentWorkingDirectory%/module-rules.json
```

```xml
<!-- psalm.xml -->
<pluginClass class="Gacela\Psalm\Plugin">
    <moduleRules rootNamespace="App" file="module-rules.json"/>
</pluginClass>
```

One file, two readers, on purpose: a boundary that holds in CI and not in the editor is a boundary nobody trusts.

The rules are **self-invalidating**, like the cycle allow list. A `from`, `allow` or `deny` naming a namespace that
matches no module fails the check: a rule about a module nobody has any more still reads as a boundary being watched.
A `deny` that never fires is not an error; that is the rule doing its job.

`--rules` cannot be combined with a filter argument: in a narrowed graph, a rule about a filtered-out module is
indistinguishable from a rule about a module that no longer exists, and those two must not look alike.

`--check --format=json` writes the findings as a report instead of lines, for a CI job that wants more than an exit
code:

```json
{
    "undeclaredCycles": [],
    "staleAllowedCycles": [],
    "forbiddenDependencies": [
        {"from": "App\\Payment", "to": "App\\Admin", "reason": "reviewed 2026-08: billing must not reach back-office"}
    ],
    "unknownRuleNamespaces": []
}
```

## Enforcing the same file from a test method [since 2.4]

The rules file has a third reader. `Gacela\Console\Testing\ModuleAssertions` puts the same graph, cycle detector,
allow list and rule checker behind three PHPUnit assertions, so a boundary decision can live next to the module's own
tests rather than only in CI configuration:

```php
self::assertModuleDependsOnlyOn(InvoiceFacade::class, [BillingFacade::class, CustomerFacade::class]);
self::assertNoModuleCycles(__DIR__ . '/allowed-cycles.json');
self::assertModuleRulesHold(__DIR__ . '/module-rules.json');
```

Failures name the offending edge and the `use` statement that writes it, as `file:line`. See
[Testing](/docs/testing#module-boundaries-in-a-test-method).

## Reviewing graph changes in CI

A new cross-module edge enters a pull request as one more `use` statement, which is exactly as visible as every other
import. `--compare-to` turns it into something a reviewer can see:

```bash
# on the base branch
vendor/bin/gacela debug:graph --format=json > base-graph.json

# on the branch under review
vendor/bin/gacela debug:graph --compare-to=base-graph.json > graph-diff.md
```

The report is GitHub-flavoured Markdown with a Mermaid block GitHub renders natively in a comment, listing new and
removed dependencies and drawing only the modules the change touches. When the graph is unchanged it writes **nothing**
and exits `0`, so a CI job can test the file for emptiness and stay quiet on the pull requests that did not move the
graph. An unreadable or invalid baseline exits `1`: that is a broken setup, not an unchanged graph, and the two must not
look alike.

## See also

- [Static analysis](/docs/static-analysis): analyser setup, the pillar rules, typed accessors, suppression
- [`debug:graph`](/docs/cli#debug-graph): every flag the graph command accepts
