+++
title = "Code generator"
weight = 100
+++

Gacela brings out of the box a code generator utility. That means, you can generate a `facade`, `factory`, `config`,
`dependency provider` or a full `module` with a single command.

#### Create one or more files of the specified type/s
```bash
make:file <target-namespace> [facade, factory, dependency-provider, config]
```

#### Creates a new full module (Facade, Factory, Config, and DependencyProvider)
```bash
make:module <target-namespace>
```

### Example
```bash
./vendor/bin/gacela make:module App/TestModule
```
