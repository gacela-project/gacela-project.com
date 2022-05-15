+++
title = "Code generator"
weight = 10
+++

Gacela Framework provides you some commands out-of-the-box to generate a `facade`, `factory`, `config`,
`dependency provider` or a full `module` with a single command.

### Example
```bash
./vendor/bin/gacela make:module App/TestModule
```

#### Creates a new Facade, Factory, Config, and DependencyProvider
```bash
make:module <target-namespace>
```

#### Create one or more files of the specified type/s
```bash
make:file <target-namespace> [facade, factory, dependency-provider, config]
```

