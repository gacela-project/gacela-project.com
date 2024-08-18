+++
title = "About Gacela"
template = "page-one-column.html"
+++

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
