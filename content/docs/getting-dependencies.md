---
title: Getting dependencies
description: Pick the wiring for internal collaborators, cross-module Facades, infrastructure, and framework entry points.
---

# Getting dependencies

Pick the wiring only once the caller and the service show you a dependency. Start from the relationship: **who needs
what, and who owns it?** Each relationship needs a different boundary, so Gacela has several resolution tools.

Ask in order:

1. Is the dependency created inside this module? Use the Factory.
2. Is it owned by another module? Request that module's Facade through the Provider.
3. Is it an application-wide implementation policy? Add a binding.
4. Is the caller created by another framework? Use constructor injection or Service Map at that entry point.

The table sums up the choice.

| Intent                                      | Recommended path                                                                                                                          |
|---------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Reach another module                        | From an entry point, `ServiceResolverAwareTrait` + `#[ServiceMap]`; from a Factory, expose the other module's Facade through the Provider |
| Build a collaborator inside the same module | A `create*()` Factory method, or `AbstractFactory::make()` for pure autowiring                                                            |
| Obtain infrastructure                       | `#[Provides]` in the Provider, or app-wide `addBinding()` for an interface                                                                |
| Collect several implementations             | `tag()` for an unkeyed iterable; `addHandlerRegistry()` for keyed lookup                                                                  |
| Read application configuration              | Typed getters on the module Config                                                                                                        |

## Reach another module

An entry point, such as a controller or a command, declares the target Facade with `#[ServiceMap]`.
`ServiceResolverAwareTrait` supplies the magic accessor:

```php
use Gacela\Framework\ServiceResolver\ServiceMap;
use Gacela\Framework\ServiceResolverAwareTrait;

#[ServiceMap(method: 'getFacade', className: BillingFacade::class)]
final class SendInvoiceController
{
    use ServiceResolverAwareTrait;

    public function __invoke(): void
    {
        $this->getFacade()->sendInvoice();
    }
}
```

Inside a Factory, go through the module's Provider. A Factory must not call another module's Facade directly:

```php
final class InvoiceProvider extends AbstractProvider
{
    #[Provides(BillingFacade::class)]
    public function billingFacade(Container $container): BillingFacade
    {
        return $container->getLocator()->get(BillingFacade::class);
    }
}

final class InvoiceFactory extends AbstractFactory
{
    public function createSender(): InvoiceSender
    {
        return new InvoiceSender(
            $this->getProvidedDependency(BillingFacade::class),
        );
    }
}
```

Cross-module access always targets the other module's Facade, never its Factory or its internal services.

## Build inside the same module

When construction involves decisions, write an explicit Factory method:

```php
public function createInvoiceSender(): InvoiceSender
{
    return new InvoiceSender($this->createPdfRenderer());
}
```

When the types alone decide the wiring, let the module container autowire it:

```php
public function createInvoiceSender(): InvoiceSender
{
    return $this->make(InvoiceSender::class);
}
```

`make()` honors bindings, contextual bindings, `#[Inject]`, `#[Singleton]`, `#[Factory]`, and `#[Lazy]`. Pass runtime
overrides by constructor parameter name: `$this->make(Service::class, ['currency' => 'EUR'])`.

## Obtain infrastructure

Declare a module-local dependency in the module's Provider:

```php
final class PaymentProvider extends AbstractProvider
{
    #[Provides(PaymentGateway::class)]
    public function paymentGateway(): PaymentGateway
    {
        return new StripeGateway();
    }
}
```

Read it in the Factory with the class-string form, so static analysis knows its type:

```php
$gateway = $this->getProvidedDependency(PaymentGateway::class);
```

For an interface-to-implementation rule across the whole application, add a binding in `gacela.php`:

```php
$config->addBinding(PaymentGateway::class, StripeGateway::class);
```

## Collect implementations

Use a tag when the consumer iterates every member:

```php
$config->tag(
    [NotEmptyValidator::class, EmailValidator::class],
    'validators',
);
```

Resolve the group in a Provider with `$container->tagged('validators')`. An app-wide tag reaches every module scope. A
tag added from one module's Provider stays local to that module.

Use `addHandlerRegistry()` when the consumer selects one handler by key:

```php
$config->addHandlerRegistry(HandlerRegistry::class, [
    'email' => EmailHandler::class,
    'sms' => SmsHandler::class,
]);
```

Use [`addPluginStack()`](/docs/extensions#plugin-stacks) when every member implements one interface and the consumer
wants them typed: [since 2.3]

```php
$config->addPluginStack(Discount::class, [
    StaffDiscount::class,
    TenPercentOff::class,
]);
```

A registry answers “which handler matches this key?” and throws on a miss. A tag answers “give me all implementations”
and has no key. A stack answers “give me every implementation of this interface”, in declaration order, checked against
the contract.

## Read configuration

Give the module Config methods named after what they return:

```php
final class BillingConfig extends AbstractConfig
{
    public function retryAttempts(): int
    {
        return $this->getInt('billing.retry-attempts', 3);
    }
}
```

The protected getters are `getString()`, `getInt()`, `getFloat()`, `getBool()`, `getArray()`, and the untyped `get()`.

## Specialized tools

These APIs are still supported. Use one when you need its specific behavior:

| Tool                      | Use it when                                                  |
|---------------------------|--------------------------------------------------------------|
| `addBindingIf()`          | A plugin supplies a default the application may override     |
| `addFactory()`            | Every resolution needs a new instance                        |
| `addProtected()`          | The value itself is a closure and must not be invoked        |
| `addAlias()`              | One service needs another identifier                         |
| `addLazy()` / `#[Lazy]`   | Construction is expensive and the service may remain unused  |
| `extendService()`         | Resolution must return a decorated or replaced service       |
| `extendProviderService()` | Only one Provider's registration of that id should be wrapped |
| `addResolvableType()`     | A class kind of your own should resolve by suffix, like a pillar |
| `afterResolving()`        | A resolved object needs an idempotent setter or similar hook |
| `when()->needs()->give()` | One consumer needs a contextual implementation or scalar     |
| `loadDefinitions()`       | Wiring is generated, shared, or environment-specific         |
| `addExternalService()`    | Bootstrap must hand a framework-owned object to Gacela       |

See [Bindings](/docs/bindings), [Provider](/docs/provider), and [Service Map](/docs/service-map) for the complete APIs.
