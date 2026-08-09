---
title: About Gacela
description: Understand the problem Gacela solves, how its module boundaries work, and when the approach fits.
---

# About Gacela

Gacela is a lightweight module framework for PHP 8.3+. It gives every module one public entry point and keeps
construction, cross-module wiring, and configuration behind that boundary.

The goal is practical: make a large codebase easier to navigate and change without forcing domain code to depend on
Gacela.

## The problem it solves

Without an explicit boundary, one feature can reach into another feature's controllers, repositories, container IDs, or
internal services. Those shortcuts make changes unpredictable because private implementation details become an
accidental public API.

Gacela replaces that ambiguity with four recognizable roles:

| Role                       | One responsibility                                | Add it when                      |
|----------------------------|---------------------------------------------------|----------------------------------|
| [Facade](/docs/facade)     | Expose the module's public capabilities           | The module has a caller          |
| [Factory](/docs/factory)   | Construct services owned by the module            | The Facade delegates work        |
| [Provider](/docs/provider) | Supply another module's Facade or infrastructure  | A service crosses a boundary     |
| [Config](/docs/config)     | Expose application settings through typed getters | Construction needs configuration |

A small module may need only a Facade and Factory. Provider and Config are optional, not ceremony to create in advance.

## Design from the caller inward

Start with the operation a controller, command, script, or another module needs. Let that real use case determine the
boundary:

```text
caller → Facade → Factory → application/domain service
                              ↓
                       Provider or Config
```

1. Write the call you want to make.
2. Express it as a focused Facade method.
3. Let the Factory build the service that fulfills it.
4. Add Provider or Config wiring only when the service reveals that need.

The [Quickstart](/docs/quickstart) builds a complete module in exactly this order.

## Why decoupling?

Decoupling is useful when it makes change local and dependencies visible. It is not an instruction to wrap every class
in an interface.

Consider a Billing module that sends an invoice. Billing should depend on a capability such as
`CustomerFacadeInterface`, not on Customer's repository or database implementation:

```text
Billing → Customer Facade → Customer internals
```

That boundary creates concrete benefits:

- **Safer changes:** Customer can replace its storage or internal services without changing Billing.
- **Focused tests:** Billing can replace the Facade interface with a small test double.
- **Clear ownership:** a dependency on another module is visible in Billing's Provider.
- **Faster navigation:** developers know where to enter a module and where to inspect its wiring.
- **Framework independence:** domain and application services remain ordinary PHP objects.

### What stays decoupled

Gacela wiring belongs at the edges. Domain and application services do not need to extend Gacela classes or know about
its container.

```php
final readonly class SendInvoice
{
    public function __construct(
        private InvoiceRepositoryInterface $invoices,
        private CustomerFacadeInterface $customers,
    ) {}
}
```

The Factory supplies module-owned collaborators. The Provider supplies `CustomerFacadeInterface`. The service remains
explicit and testable.

### Boundaries are not layers

Gacela works with layered, hexagonal, vertical-slice, or other architectures. A module may contain Domain, Application,
and Infrastructure directories, but Gacela does not require them. It standardizes communication **between modules**, not
the internal design of each module.

## A typical module

```text
src/Billing/
├── Application/
├── Domain/
├── Infrastructure/
├── BillingFacade.php
├── BillingFactory.php
├── BillingProvider.php   # only when external dependencies exist
└── BillingConfig.php     # only when application settings exist
```

Names may use the shorter `Facade.php`, `Factory.php`, `Provider.php`, and `Config.php` convention shown in
the [Quickstart](/docs/quickstart). Pick one project convention and keep it consistent.

## When Gacela fits

Gacela is a strong fit when:

- a PHP application has several features or teams;
- module internals change more often than their public capabilities;
- cross-module dependencies are difficult to discover;
- the project needs enforceable boundaries without replacing its framework.

It may be unnecessary for a small script or a single cohesive component. Even there,
the [single-file module pattern](/docs/extra) is available when a lightweight boundary still helps.

## Continue

- [Build the first module](/docs/quickstart)
- [Choose a dependency mechanism](/docs/getting-dependencies)
- [Explore production code from Phel](/used-in)
