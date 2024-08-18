+++
title = "Gacela script"
description = "Out-of-the-box utility scripts that Gacela brings"
weight = 50
+++

> **Note**: To use the *Gacela script*, you need at least `"symfony/console": "^5.4"`

## List modules

```bash
vendor/bin/gacela list:modules [--detailed|-d]
# Description:
#   Render all modules found
# 
# Usage:
#   list:modules [options] [--] [<filter>]
# 
# Arguments:
#   filter                Any filter to simplify the output
# 
# Options:
#   -d, --detailed        Display all the modules in detail
```

## Code generator

You can generate a `facade`, `factory`, `config`, `provider`, or full `module`.

### Create specific Gacela classes

```bash
vendor/bin/gacela make:file [-s] <target-namespace> <facade factory config provider>
# Description:
#   Generate a Facade, Factory, Config, Provider
# 
# Usage:
#   make:file [options] [--] <path> <filenames>...
# 
# Arguments:
#   path                  The file path. For example "App/TestModule/TestSubModule"
#   filenames             Facade, Factory, Config, Provider
# 
# Options:
#   -s, --short-name      Remove module prefix to the class name
```

Example:
```bash
# You can create one or more files at once
vendor/bin/gacela make:file App/TestModule facade factory provider
```

### Creates a new full module

Generates the Facade, Factory, Config, and Provider.

```bash
vendor/bin/gacela make:module [-s] <target-namespace>
# Description:
#   Generate an empty module with a Facade, Factory, Config, Provider
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
vendor/bin/gacela make:module -s App/TestModule
```
