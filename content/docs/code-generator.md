+++
title = "Code generator"
weight = 10
+++

You can install Gacela CLI as dependency, and then you will be able to generate a `facade`, `factory`, `config`,
`dependency provider` or a full `module` with a single command.

```php
composer create-project gacela-project/gacela-cli
```

#### Create one or more files of the specified type/s
```bash
make:file <target-namespace> [facade, factory, dependency-provider, config]
```

#### Creates a new module (Facade, Factory, Config, and DependencyProvider)
```bash
make:module <target-namespace>
```

### Example
```bash
./vendor/bin/gacela make:module App/TestModule
```
