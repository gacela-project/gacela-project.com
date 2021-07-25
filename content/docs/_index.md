+++
template = "page.html"
+++

# Documentation

Gacela is a class resolver, which basically consist on these classes:

- [Facade](/docs/facade): it is the entry point of your module.
- [Factory](/docs/factory): it creates the module's services.
- [Config](/docs/config): it can get the key-values from your config files.
- [Dependency Provider](/docs/dependency-provider): it gets other Facades.

### Extra

- [Basic concepts](/docs/basic-concepts): common characteristics of a module.
- [Code Generator](/docs/code-generator): some commands out-of-the-box to generate some boilerplate code.


## Basic Gacela structure

```bash
application-name
├── gacela.json
├── config // Default config behaviour. You can change it in `gacela.json`
│   ├── local.php
│   └── default.php
│
├── src
│   ├── ExampleModuleWithoutPrefix
│   │   ├── Domain
│   │   │   └── YourLogicClass.php
│   │   ├── Config.php
│   │   ├── Facade.php
│   │   └── Factory.php
│   │
│   └── ExampleModuleWithPrefix
│       ├── Domain
│       │   └── YourLogicClass.php
│       ├── ExampleModuleWithPrefixConfig.php
│       ├── ExampleModuleWithPrefixFacade.php
│       └── ExampleModuleWithPrefixFactory.php
│
├── tests
│   └── ...
└── vendor
    └── ...
```

# Decoupled business logic

Don't couple your business domain logic with any infrastructure code.

**Infrastructure code is everything that has nothing to do directly with the logic of your business**. What is NOT business logic?

- the framework that you are using
- the connection to the database
- the I/O system

All of these are irrelevant details that should not be attached to your business logic.

> In order to accomplish this goal, we should depend on abstractions (interfaces) instead of concretions.

## A complete application consists of three major layers

- Domain
- Application
- Infrastructure

### The Domain layer

The domain layer contains the domain entities and stand-alone domain services.
Any domain concepts (this includes domain services, but also repositories) that depend on external resources, are defined by **interfaces**.

### The Application layer

The application layer contains the implementation of the application services.
These services shouldn't have "business logic" in them, even though they orchestrate the steps required to fulfill the commands imposed by the client.
The main difference between the domain and the application services is that domain services hold domain logic whereas application services don’t.

### The Infrastructure layer

The infrastructure layer **contains the implementation of the interfaces from the domain layer**.
These implementations may introduce new non-domain dependencies that have to be provided to the application.
Usually, the infrastructure layer is where all non-relevant-to-your-domain-details are placed.

## Benefits

- Easy **testability**. When your business logic depend on abstractions (interfaces) you can easily create unit tests for all possible combinations of its behavior.
- Your business logic became **easy to be replaced** and to be adapted to the new requirements.
- **Loosely couple** with infrastructure code. When your logic depends on abstraction, you can postpone the details to the end and rather focus on the business requirements. 

# Understanding Gacela better

Gacela is a framework which is coupled in your application as the `application` layer.
The fundamentals of this idea is, Gacela uses some design patterns in order to accomplish this idea. Those patters are `Facade` and `Factory`.

## Facade

The responsibility of the Facade is to provide a simplified interface in order to hide the domain implementation.

In Gacela, the facade is the entry point of your module, it will just give you the method with the possible actions this module can do.

You can read more about this topic [in the facade section](/docs/facade).

## Factory

The responsibility of the Factory is to orchestrate the different classes, and it's dependencies (through `dependency provider` or `config`).

Basically, the factory class creates the classes of your logic and it's dependencies, when ready, they are provided to the facade. It's a layer between the user and your domain.

You can read more about this topic [in the factory section](/docs/factory).
