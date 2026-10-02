---
title: Module boundaries
description: Enforce module boundaries with cross-module rules, a dependency-cycle gate, a declared rules file, and a CI graph review.
---

# Module boundaries

Module A may reach module B only through B's Facade. This page covers everything that enforces that rule, and the
agreements built on top of it: two opt-in analyser rules, a dependency-cycle gate on [`debug:graph`](/docs/cli#debug-graph),
a declared rules file both readers share, and a CI review for graph changes.

The rules run under both PHPStan and Psalm. [Static analysis](/docs/static-analysis) covers installing the analysers,
the always-on pillar rules, and suppression.

## The cross-module rules

This is the one check that cannot be on by default. Nothing in a class name says where a module boundary falls, so the
check needs your root namespace.

It comes in **two halves**. Enable them together.

The first matches the module names a source *writes*: a `new`, a static call, a class constant, a static property. The
second, new in 2.1, resolves the receiver of a method call by **type**. Once dependencies go through Providers and
constructors, that is how code crosses a boundary:

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

The class appears once, in a type-hint. A check that matched only written names would report green on exactly the
codebases most likely to cross boundaries.

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
is worse than no rule: it reads as a green check, and nothing tells you the boundary went unchecked.

### What it accepts

- `sharedNamespaces` entries are exempt in both directions: references into them are always allowed, and classes inside
  them are not checked. Matching respects namespace boundaries, so `App\Modules\Shared` does not exempt
  `App\Modules\SharedFoo`.
- A **call** on a `*Facade` or a `*FacadeInterface` is allowed. Consumers type-hint the interface, and that is the same
  sanctioned crossing. A **written reference** is allowed only for `*Facade`, because naming `SomeFacadeInterface::class`
  is not a call through one.
- A receiver the analyser cannot resolve is not reported. An unknown type is no evidence of a violation, and guessing
  would turn the rule into noise.
- One line can produce two findings. `(new ShopService())->run()` both names the other module and calls into it. Those
  are two crossings with two corrections, so both are reported.

To see your app's real module dependency graph, run [`debug:graph`](/docs/cli#debug-graph).

## What a module exports [since 2.4]

A module's public surface is wider than its Facade: DTOs, enums, value objects, events and plugin contracts. A Facade
that returns an invoice publishes the invoice too, and another module reads it because that is why it was returned.
Both cross-module rules leave that surface alone. You declare it in two ways, and both analysers read them the same way.

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
a base class would publish everything that ever extends it, so mark each exported type. Classes written by
[`dto:generate`](/docs/cli#dto-generate) already carry it.

### The namespace convention

A module publishes every class under a list of sub-namespace **segment names**: by default `Shared`, `Transfer`, `Dto`
and `Event`. `App\Billing\Shared\Invoice` and `App\Billing\Domain\Dto\Money` are both exported with no annotation.
Segments match whole, at any depth, never as prefixes: `Event` publishes `App\Billing\Event\` and leaves
`App\Billing\EventHandler\` alone. The convention never publishes a class that sits directly in its module.

Configure it on both cross-module rules:

|                 | PHPStan                             | Psalm                                    |
|-----------------|-------------------------------------|------------------------------------------|
| Configured with | `publicApiSegments:` (a list)       | `<publicApiSegment>` (one element each)  |
| Left out        | the default list applies            | the default list applies                 |
| Turned off      | an explicit `publicApiSegments: []` | a single empty `<publicApiSegment/>`     |

This differs from `sharedNamespaces`. A shared namespace is a fully qualified prefix that belongs to no module, exempt
in both directions. A public API segment is a sub-namespace under each module, and a class in it still belongs to the
module that owns it.

### Reading the surface back

[`debug:module Billing`](/docs/cli#debug-module) prints a `Public API` section that lists what the module exports,
from the attribute and the convention together, or `(none)`. The `--json` document carries it under `publicApi`.

### What it does not do

Publishing a class says other modules may touch it **without going through the Facade**. It does not say two modules
may be coupled at all. [The declared rules file](#declaring-which-modules-may-depend-on-which) answers that, and
`#[PublicApi]` deliberately does not exempt a class from `DeclaredModuleDependencyRule`. `debug:graph --check` enforces
the same rules file from `use` imports and cannot see an attribute. An exemption in the analyser alone would leave the
editor green and CI red on the same line.

## Failing on dependency cycles

`debug:graph --check` exits non-zero when two modules depend on each other:

```bash
vendor/bin/gacela debug:graph --check
```

A cycle is either a decision somebody made or a mistake nobody noticed. Until someone writes the decision down, you
cannot tell them apart. Write it in a JSON file and pass it in:

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

The allow list is **self-invalidating**: an entry that no longer matches a real cycle fails the check as loudly as an
undeclared cycle. That is deliberate. An allow list that outlives what it allows stops recording a decision and becomes
a mute button, and nothing would tell you. A `reason` is required for the same reason: an allowance nobody justified
looks the same as a cycle nobody noticed.

`debug:graph` without `--check` stays exit-code-neutral, so adding the gate does not change what the command already
did.

## Declaring which modules may depend on which [since 2.2]

A cycle is the only thing the graph can refuse on its own. Everything else a team agrees on ("billing must not reach
back-office", "reporting reads and nothing more") lives in prose. No tool can see it there, and a violation arrives as
one more import in a diff. Write it in a JSON file instead:

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
- `allow` is the opposite: the listed modules are the **only** ones reachable, and anything else is a violation. An
  empty `allow` has a meaning: a leaf module that may depend on nothing.
- One entry cannot carry both, and a rule without a `reason` is refused.
- A rule about `App\Payment` also governs `App\Payment\Refunds`. Matching respects namespace boundaries:
  `App\Pay` never governs `App\Payment`.

Two places read the same file. CI reads it over the whole graph:

```bash
vendor/bin/gacela debug:graph --check --rules=module-rules.json
```

Your editor reads it per class, through whichever analyser you run:

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

One file, two readers, on purpose: nobody trusts a boundary that holds in CI and not in the editor.

The rules are **self-invalidating**, like the cycle allow list. A `from`, `allow` or `deny` that names a namespace
matching no module fails the check: a rule about a module that no longer exists still reads as a boundary under watch.
A `deny` that never fires is not an error. That is the rule doing its job.

`--rules` cannot be combined with a filter argument. In a narrowed graph, a rule about a filtered-out module looks the
same as a rule about a module that no longer exists, and those two must not look alike.

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
allow list and rule checker behind three PHPUnit assertions. A boundary decision can then live next to the module's own
tests, not only in CI configuration:

```php
self::assertModuleDependsOnlyOn(InvoiceFacade::class, [BillingFacade::class, CustomerFacade::class]);
self::assertNoModuleCycles(__DIR__ . '/allowed-cycles.json');
self::assertModuleRulesHold(__DIR__ . '/module-rules.json');
```

Failures name the offending edge and the `use` statement behind it, as `file:line`. See
[Testing](/docs/testing#module-boundaries-in-a-test-method).

## Reviewing graph changes in CI

A new cross-module edge enters a pull request as one more `use` statement, no more visible than any other import.
`--compare-to` makes it visible to a reviewer:

```bash
# on the base branch
vendor/bin/gacela debug:graph --format=json > base-graph.json

# on the branch under review
vendor/bin/gacela debug:graph --compare-to=base-graph.json > graph-diff.md
```

The report is GitHub-flavoured Markdown with a Mermaid block that GitHub renders natively in a comment. It lists new
and removed dependencies and draws only the modules the change touches. When the graph is unchanged, it writes
**nothing** and exits `0`. A CI job can test the file for emptiness and stay quiet on pull requests that did not move
the graph. An unreadable or invalid baseline exits `1`: that is a broken setup, not an unchanged graph, and the two must
not look alike.

## See also

- [Static analysis](/docs/static-analysis): analyser setup, the pillar rules, typed accessors, suppression
- [`debug:graph`](/docs/cli#debug-graph): every flag the graph command accepts
