+++
title = "Code generator"
description = "Gacela brings out of the box a code generator utility"
weight = 100
+++

Note: To be able to use this, you have to have installed `"symfony/console": "^5.4"`.

You can generate a `facade`, `factory`, `config`, `dependency provider`, or full `module`

## Create specific Gacela classes

```bash
make:file [-s] <target-namespace> <facade factory config dependency-provider>
# Description:
#   Generate a Facade, Factory, Config, DependencyProvider
# 
# Usage:
#   make:file [options] [--] <path> <filenames>...
# 
# Arguments:
#   path                  The file path. For example "App/TestModule/TestSubModule"
#   filenames             Facade, Factory, Config, DependencyProvider
# 
# Options:
#   -s, --short-name      Remove module prefix to the class name
```

You can create one or more files at once. Eg:
```bash
./vendor/bin/gacela make:file App/TestModule facade factory
```

## Creates a new full module

Generates the Facade, Factory, Config, and DependencyProvider.

```bash
make:module <target-namespace>
# Description:
#   Generate an empty module with a Facade, Factory, Config, DependencyProvider
# 
# Usage:
#   make:module [options] [--] <path>
# 
# Arguments:
#   path                  The file path. For example "App/TestModule/TestSubModule"
# 
# Options:
#   -s, --short-name      Remove module prefix to the class name
```

Example:
```bash
./vendor/bin/gacela make:module App/TestModule
```
