---
name: conventions
description: TypeScript, CSS and prose conventions for every file
alwaysApply: true
---

- **TypeScript, ESM, `.ts` extensions in imports.** Node runs the source directly via type stripping, so there is no build
  step for the generator. That means: no enums, no parameter properties, no namespaces, nothing that needs code
  generation. `erasableSyntaxOnly` is on and will tell you.
- **`type` imports are explicit** (`verbatimModuleSyntax`).
- **No default exports** except in `src/templates`, where a file is one template.
- **Strict null handling.** `noUncheckedIndexedAccess` is on; index access is `T | undefined` and must be narrowed.
- **CSS**: `@layer reset, tokens, base, layout, components, utilities`. Colours, spacing, type sizes and radii come from
  tokens in `src/design/tokens.css`. A raw hex value outside that file is a bug.
- **No em dashes in prose.** Use a comma, a colon, or a full stop.
