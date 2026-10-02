---
title: Reference application
description: An invoicing application inside the Gacela repository that wires every feature at once and runs on every pull request.
---

# Reference application [since 2.4]

Every feature in Gacela has a fixture built for it. None of them answered whether the features still compose: several
fixes (a stale cache, listeners lost between `gacela.php` and the bootstrap closure, unusable remediations) were each
found by probing a scratch project by hand, because no fixture had the whole thing wired at once.

The reference application is that project, inside the repository, run on every pull request. It lives in
[`tests/Feature/ReferenceApp/`](https://github.com/gacela-project/gacela/tree/main/tests/Feature/ReferenceApp) and is
an invoicing SaaS: small enough to read in one sitting, large enough that every capability has a place it belongs.
Read it when you want to see a feature used next to all the others.

## The application

The application root is
[`tests/Feature/ReferenceApp/Invoicing/`](https://github.com/gacela-project/gacela/tree/main/tests/Feature/ReferenceApp/Invoicing),
the directory holding `gacela.php`, `config/` and the five modules.

| Module         | What it is, and what it shows                                                                                                                                                                                                                                                         |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Customer`     | The customer directory. A `#[Cacheable]` lookup with a per-reference key, and a shape declared with `declareDtoSchema()` whose generated class is committed.                                                                                                                         |
| `Billing`      | Issues invoices. Reaches `Customer` through `#[Provides]` and `getProvidedDependency()`, announces `InvoiceIssuedEvent` through the injected event dispatcher without naming whoever reacts, runs a plugin stack of tax rules and a tagged set of validators, and reads typed configuration against a declared schema. |
| `Payment`      | Takes the money. Declares a fifth resolvable kind, `Gateway`, dispatches by key through a handler registry, and gets a stricter retry policy through a contextual binding. Its pillars keep the names it arrived with (`PaymentApi`, `PaymentBuilder`, `PaymentSettings`, `PaymentDependencyProvider`), which is what `addSuffixTypeFacade()` and its siblings are for. |
| `Notification` | Delivers, and reacts. It handles Billing's `InvoiceIssuedEvent` (the subscriber names the event, the publisher names nobody) behind a plugin stack of channels, a header list the application extends with `extendService()`, and a resolver-event listener registered in `gacela.php`. |
| `Reporting`    | Reads. Billing's declared shapes through `#[Provides]` and Customer's names through a `#[ServiceMap]` accessor, and nothing else: the module the boundary rules are written about.                                                                                                   |

Beside them, `Shared/` is a shared kernel rather than a module: a clock the host supplies, a retry policy, the
invokables that extend the configuration, and the plugins that run at bootstrap. Both analyser configurations name it
as such.

Repositories are in-memory arrays. There is no HTTP and no database: those belong to the host, and the point here is
the wiring.

### The two installed packages

`Packages/` holds two Composer packages, declared in a hand-written `Invoicing/vendor/composer/installed.json`, because
nothing here is actually installed. They show [package discovery](/docs/packages) both ways:

- `gacela-fixture/invoice-audit` is **kept**. It adds a delivery channel to the stack `Notification` publishes and a
  reaction to `InvoiceIssuedEvent`, and `gacela.php` names it nowhere. The flow test sees its `audit:` receipts beside
  the `email:` ones, and `debug:events` reports two listeners on the event.
- `gacela-fixture/legacy-numbering` is **refused** with `dontDiscover(['gacela-fixture/legacy-numbering'])`. It would
  replace the invoice number format, so the expected `ACME-INV-01001` in the flow test proves its file was never opened.

### Configuration

- `gacela.php`: the composition root, and the most useful single file to read.
- `gacela-prod.php`: only the differences, read when `APP_ENV=prod`.
- `config/app.php`, `config/app-prod.php`, `config/app-prod-eu.php`: the base layer and the two that refine it, the
  second selected by the declared `APP_REGION` [dimension](/docs/config#config-dimensions).
- `services.php`: the wiring that is data, read by `loadDefinitions()`.
- `module-rules.json`: the boundaries, read by `debug:graph --check --rules` and by both analysers.

`payment.default_method` is set in `config/app-prod.php` and nowhere else, so outside production the schema's declared
default answers for it. That demonstrates that the base layer excludes the environment files `config/*.php` also
matches.

## The harness

Three test classes, each answering a different question:

| Test                                                                                                                                             | Asks                                                                                                                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`InvoicingFlowTest`](https://github.com/gacela-project/gacela/blob/main/tests/Feature/ReferenceApp/InvoicingFlowTest.php)                       | Does the application work? One flow (register, issue, pay, report) run as a developer runs it and again as production in the EU region.                                                |
| [`InvoicingToolingTest`](https://github.com/gacela-project/gacela/blob/main/tests/Feature/ReferenceApp/InvoicingToolingTest.php)                 | Does the toolchain work on it? Every command Gacela ships, run against this application, asserting the exit code and one fact of the output.                                         |
| [`ReferenceAppUsesEveryFeatureTest`](https://github.com/gacela-project/gacela/blob/main/tests/Feature/ReferenceApp/ReferenceAppUsesEveryFeatureTest.php) | Is it still a reference? Reflects `GacelaConfig`, the attributes, the traits and the command catalogue, and fails on anything the application does not use and has not explained. |

From a clone of the Gacela repository:

```bash
composer test-feature -- --filter=ReferenceApp
composer test-integration -- --filter=ReferenceAppTest
```

The second runs [static analysis](/docs/static-analysis) over the application at PHPStan level `max` and Psalm
`errorLevel="1"`, with the shipped rules **and the three opt-in ones**: cross-module access, declared module
dependencies, and `#[ServiceMap]` completeness. Their configurations,
[`phpstan-reference-app.neon`](https://github.com/gacela-project/gacela/blob/main/tests/Feature/ReferenceApp/phpstan-reference-app.neon)
and
[`psalm-reference-app.xml`](https://github.com/gacela-project/gacela/blob/main/tests/Feature/ReferenceApp/psalm-reference-app.xml),
are worth copying into a project.

## What it does not prove

The module graph is built from `use` imports at module granularity, so `module-rules.json` can say that nothing may
depend on `Reporting` but cannot say that Reporting may reach only Billing's Facade. That second rule is the
analysers' job, which is why both [cross-module rules](/docs/module-boundaries#the-cross-module-rules) are enabled.

Nor can a graph say anything about `Notification` reacting to `Billing`. An event leaves no import behind in the module
that dispatched it, so no graph and no rule can tell you who is listening. [`debug:events`](/docs/cli#debug-events)
can, and the registration in `gacela.php` is the one place it is written down.

The [upstream page](https://github.com/gacela-project/gacela/blob/main/docs/reference-app.md) also covers how the
application is used to try a new feature before its API is fixed, and how its generated shapes are regenerated.
