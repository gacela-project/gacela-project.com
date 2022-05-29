+++
title = "About Gacela"
template = "page-one-column.html"
+++

Gacela helps you to build modular applications.

Splitting your project into different modules help in terms of maintainability and scalability. It encourages your
modules to interact with each other in a unified way by following these rules:

- The [**Facade**](/docs/facade) is the entry point of your module, and has direct access to the Factory.
- The [**Factory**](/docs/factory) resolves the intra-dependencies of your module's classes, and has access to the Config.
- The [**Config**](/docs/config) has access to the key-values from your config files.
- The [**DependencyProvider**](/docs/dependency-provider) resolves the extra-dependencies of your module.

## Module structure

```bash
application-name
├── gacela.php                     # You can customize some behaviours of gacela. 
│
├── config
│   ├── default.php
│   └── local.php
│
├── public
│   └── index.php                  # An example of your application entry point.
│
├── src
│   ├── ExampleModuleWithoutPrefix
│   │   ├── Domain                 # The directory structure/naming here is up to you.
│   │   │   └── YourLogicClass.php
│   │   ├── Facade.php             # These are the 4 "gacela classes":
│   │   └── Factory.php            # - You can prefix them with its module name.
│   │   ├── Config.php             # - Autowiring customizable in `gacela.php`.
│   │   └── DependencyProvider.php # - Suffix naming customizable in `gacela.php`.
│   │
│   └── ExampleModuleWithPrefix
│       ├── Domain
│       │   └── YourLogicClass.php
│       ├── ExampleModuleWithPrefixFacade.php
│       └── ExampleModuleWithPrefixFactory.php
│       ├── ExampleModuleWithPrefixConfig.php
│       └── ExampleModuleWithPrefixDependencyProvider.php
│
├── tests
│   └── ...
└── vendor
    └── ...
```

Gacela is coupled to your application as the `application`/`infrastructure` layer. Depending on how do you use it. 
It uses the `Facade` and `Factory` patterns to accomplish this idea.

## Facade

The responsibility of the Facade is to provide a simplified interface to hide the domain implementation.
It will simply give you the methods with the possible actions this module can do.

> In Gacela, the Facade is the entry point of your module. 

## Factory

The Factory's responsibility is to orchestrate the different classes and it's dependencies 
(through Dependency Provider or Config).

The Factory class creates the classes of your logic and its dependencies. 
They are provided to the Facade. It's a layer between the user and your domain.

> It resolves the intra-dependencies of your module's classes.

## Dependency Provider

The communication between different modules it's done via their Facades because they are the entry point of a module.
The main difference between Factories and Dependency Providers is that Factories are responsible for in-module
dependencies, while Dependency Providers are responsible for module-to-module dependencies.

> It resolves the extra-dependencies of your module.

## Config

This concept is not a design pattern itself, but it's designed in a way that you can easily access all config values in
your modules, and it's accessible from the Factory out of the box. The Config allows you to construct your business
objects with specific configuration values clearly and straightforwardly.

> It has access to the key-values from your config files.
