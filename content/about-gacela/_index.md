+++
template = "page.html"
+++

# About Gacela

Gacela is a class resolver, which basically consist on these classes:

- [Facade](/about-gacela/facade): it is the entry point of your module.
- [Factory](/about-gacela/factory): it creates the module's services.
- [Config](/about-gacela/config): it can get the key-values from your config files.
- [Dependency Provider](/about-gacela/dependency-provider): it gets other Facades.
- [Code Generator](/about-gacela/code-generator): some commands out-of-the-box to generate some boilerplate code.

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

Gacela is coupled in your application as the `application` layer. It uses some design patterns (`Facade` and `Factory`)
to accomplish this idea.

## Facade

The responsibility of the Facade is to provide a simplified interface to hide the domain implementation.

In Gacela, the Facade is the entry point of your module. It will simply give you the methods with the possible actions
this module can do.

## Factory

The Factory's responsibility is to orchestrate the different classes and it's dependencies 
(through Dependency Provider or Config).

The Factory class creates the classes of your logic and its dependencies. 
They are provided to the Facade. It's a layer between the user and your domain.

## Dependency Provider

The communication between different modules it's done via their Facades because they are the main entry point of a
module. The main difference between Factories and Dependency Providers is that Factories are responsible for in-module
dependencies, while Dependency Providers are responsible for module-to-module dependencies.

## Config

This concept is not a design pattern itself, but it's designed in a way that you can easily access all config values in
your modules, and it's accessible from the Factory out of the box. The Config allows you to construct your business
objects with specific configuration values clearly and straightforwardly.

