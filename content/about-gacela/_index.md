+++
template = "page.html"
+++

# About Gacela

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
