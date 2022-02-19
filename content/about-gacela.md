+++
title = "About Gacela"
template = "page-one-column.html"
+++

Gacela is a class resolver, which basically consist on these classes:


- **Facade**: it is the entry point of your module.
- **Factory**: it creates the module's services.
- **Config**: it can get the key-values from your config files.
- **DependencyProvider**: it gets other Facades.

## Basic Gacela structure

```bash
application-name
├── gacela.php
├── config ## Default config behaviour. Changeable in `gacela.php`
│   ├── local.php
│   └── default.php
│
├── src
│   ├── ExampleModuleWithoutPrefix
│   │   ├── Domain
│   │   │   └── YourLogicClass.php
│   │   ├── Facade.php
│   │   └── Factory.php
│   │   ├── Config.php
│   │   └── DependencyProvider.php
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