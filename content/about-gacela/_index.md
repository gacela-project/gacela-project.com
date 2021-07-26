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

Gacela is coupled in your application as the `application` layer. It uses some design patterns (`facade` and `factory`) in order to accomplish this idea.

## Facade

The responsibility of the Facade is to provide a simplified interface in order to hide the domain implementation.

In Gacela, the facade is the entry point of your module, it will just give you the method with the possible actions this module can do.

## Factory

The responsibility of the Factory is to orchestrate the different classes, and it's dependencies (through `dependency provider` or `config`).

Basically, the factory class creates the classes of your logic and it's dependencies, when ready, they are provided to the facade. It's a layer between the user and your domain.
