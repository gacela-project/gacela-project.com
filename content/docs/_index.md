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

---


Splitting your project into different modules will help its design in
terms of maintainability and scalability. It will certainly encourage your modules to interact with each
other in a unified way by
following these rules:

<ul>
    <li>Modules interact with each other <b>only</b> via their <i>Facade</i>.</li>
    <li>The <a href="/docs/facade">Facade</a> has access to the <i>Factory</i>.</li>
    <li>The <a href="/docs/factory">Factory</a> creates the module's objects.</li>
    <li>The <a href="/docs/config">Config</a> is accessible from the Factory.</li>
    <li>The <a href="/docs/dependency-provider">Dependency Provider</a> gets other <i>Facades</i>.</li>
</ul>