---
title: Used in
description: Projects built with Gacela, including Phel, a functional Lisp dialect that compiles to PHP.
---

# Used in

Projects that build on Gacela. If you ship something with it,
[open a pull request](https://github.com/gacela-project/gacela-project.com) and add yourself.

## Phel Lang

<p>
  <a href="https://phel-lang.org/" rel="noreferrer" aria-label="Phel Lang">
    <svg width="150" height="128" viewBox="0 0 200 170" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true">
      <path d="M6 66l95 96h36V93l-36-74H42L6 56v106h36l24-35"/>
      <path d="M137 93l58-3-12-58-32-26h-34l-16 13-23 9-12 22 46 52z"/>
      <path d="M195 90l-12 57h-13l-2-56m2 56l-13-11h12"/>
    </svg>
  </a>
</p>

Phel is a functional programming language that compiles to PHP. It is a dialect of Lisp inspired by
Clojure and Janet, and it uses Gacela to keep its compiler, REPL and runtime in separate modules.

**What it offers**

- Persistent data structures: lists, vectors, maps and sets
- Macros, a REPL, and error reporting that points at the right form
- The whole of PHP's ecosystem, reachable from Lisp

**Why it exists**

- Functional programming without leaving the PHP runtime
- It runs anywhere PHP runs, including cheap shared hosting
- Small enough to read, which makes it pleasant to debug

Read [the story of its first release](https://chemaclass.com/blog/phel-first-release/), or go
straight to [phel-lang.org](https://phel-lang.org/).
