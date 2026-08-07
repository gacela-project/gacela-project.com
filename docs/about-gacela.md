---
title: About Gacela
description: Understand Gacela’s module model and why explicit boundaries make PHP applications easier to change.
next: false
prev: false
sidebar: false
outline: false
---

# About Gacela

Gacela standardizes how PHP modules expose capabilities and obtain dependencies without dictating how you write domain logic.

**Vision:** Make communication between application modules simple and explicit.

**Mission:** Give every module one recognizable entry point while keeping business logic independent of framework wiring.

## Build modular applications

Splitting an application into focused modules makes ownership, testing, and change easier—but only when the boundaries stay clear.

Gacela keeps those boundaries predictable:

- Modules interact with each other via their **Facade**
- The [**Facade**](/docs/facade) is the *entry point* of a module
- The [**Factory**](/docs/factory) creates services inside the module
- The [**Provider**](/docs/provider) supplies cross-module and infrastructure dependencies
- The [**Config**](/docs/config) exposes application settings through typed getters

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

The Facade exposes a small API and hides implementation details. Its methods describe what the module can do.

> The Facade is the entry point of your module.

### [**Factory**](/docs/factory)

The Factory creates the module's application and domain services with their dependencies. The Facade delegates work to those services.

> It creates and wires services inside the module.

### [**Provider**](/docs/provider)

Modules communicate through Facades. Factories own internal construction; Providers make another module's Facade or an infrastructure service available at the boundary.

> It supplies dependencies from outside the module.

### [**Config**](/docs/config)

Config gives the Factory typed access to application settings so business objects do not need to read files or environment variables.

> It has access to the key-values from your config files.

## Why decoupling?

Business logic should not depend directly on infrastructure details such as:

- the framework that you are using
- the connection to the database
- the I/O system

These concerns matter operationally, but they are not the rules of the business. Depending on abstractions lets domain code remain stable while infrastructure changes.

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

- **Focused tests:** replace interfaces with small test doubles without booting infrastructure.
- **Safer change:** replace an implementation without changing the module's public API.
- **Deferred decisions:** design business behavior first and select infrastructure at the boundary.
