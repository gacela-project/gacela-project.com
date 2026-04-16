---
next: false
prev: false
sidebar: false
outline: false
---

# About Gacela

**VISION**: Simplify the communication of your different modules in your web application.

**MISSION**: Normalize the entry point of a module, without interfering with your domain-business logic.

## Gacela helps you to build modular applications

Splitting your project into different modules help in terms of maintainability and scalability.

It encourages your modules to interact with each other in a unified way by following these rules:

- Modules interact with each other via their **Facade**
- The [**Facade**](/docs/facade) is the *entry point* of a module
- The [**Factory**](/docs/factory) manage the *intra-dependencies* the module
- The [**Provider**](/docs/provider) resolves the *extra-dependencies* of the module
- The [**Config**](/docs/config) has access to the project's *config files*

## Module structure

```bash
application-name
├── gacela.php
├── config
│   └── ...
│
├── src
│   ├── ModuleA
│   │   ├── Domain
│   │   │   └── ...
│   │   ├── Application
│   │   │   └── ...
│   │   ├── Infrastructure
│   │   │   └── ...
│   │   │ # These are the 4 "gacela classes":
│   │   ├── Facade.php
│   │   ├── Factory.php
│   │   ├── Provider.php
│   │   └── Config.php
│   │
│   └── ModuleB
│       └── ...
│
├── tests
│   └── ...
└── vendor
    └── ...
```

## Gacela uses the Facade and Factory patterns

### [**Facade**](/docs/facade)

The Facade's responsibility is to provide a simplified interface to hide details' implementation.
It provides methods for the possible actions this module can take.

> The Facade is the entry point of your module.

### [**Factory**](/docs/factory)

The Factory class creates the classes of your logic and its dependencies.
They are provided to the Facade, which is a layer between the user and your domain.

> It resolves the intra-dependencies of your module's classes.

### [**Provider**](/docs/provider)

Communication between different modules is done via their Facades because they are the entry point of a module.
The main difference between Factories and Providers is
- Factories are responsible for in-module dependencies,
- while Providers are responsible for module-to-module dependencies.

> It resolves the extra dependencies of your module.

### [**Config**](/docs/config)

Enables access to all config values in your modules from the factory out-of-the-box.
The Config allows you to construct your business objects with specific configuration values.

> It has access to the key-values from your config files.

## Why decoupling?

There are a lot of reasons why you shouldn't couple your business/domain logic with any infrastructure code.
**Infrastructure code is everything that has nothing to do directly with the logic of your business**. What is NOT
business logic?

- the framework that you are using
- the connection to the database
- the I/O system

All of these are irrelevant details that should not be attached to your business logic.

In order to accomplish this goal, we should depend on abstractions instead of concretions.

### A complete application consists of three major layers

- Domain
- Application
- Infrastructure

#### The Domain layer

The domain layer contains the domain entities and stand-alone domain services.
Any domain concepts (this includes domain services, but also repositories) that depend on external resources, are defined by **interfaces**.

#### The Application layer

The application layer contains the implementation of the application services.
These services shouldn't have "business logic" in them, even though they orchestrate the steps required to fulfill the commands imposed by the client.
The main difference between the domain and the application services is that domain services hold domain logic whereas application services don't.

#### The Infrastructure layer

The infrastructure layer **contains the implementation of the interfaces from the domain layer**.
These implementations may introduce new non-domain dependencies that have to be provided to the application.
Usually, the infrastructure layer is where all non-relevant-to-your-domain-details are placed.

### Benefits

- Easy **testability**. When your business logic depend on abstractions (interfaces) you can easily create unit tests for all possible combinations of its behavior
- Your business logic became **easy to be replaced** and to be adapted to the new requirements
- **Loosely couple** with infrastructure code. When your logic depends on abstraction, you can postpone the details to the end and rather focus on the business requirements