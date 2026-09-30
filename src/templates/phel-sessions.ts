import type { TerminalSession } from './terminal.ts'

/**
 * Real output from the Gacela 2.4.0 CLI, run against phel-lang at the commit
 * below. Excerpts mark what they leave out with a line holding only "…"; every
 * other line is printed as the command printed it. Re-record all four together
 * when refreshing, so the numbers in the copy still match.
 */
const COMMIT = 'eea8d09ce1e5f6b9baf6cc452834f052f3202eaf'

const source = {
  href: `https://github.com/phel-lang/phel-lang/tree/${COMMIT}`,
  label: `phel-lang@${COMMIT.slice(0, 7)}`,
}

export const listModules: TerminalSession = {
  command: 'vendor/bin/gacela list:modules',
  source,
  output: [
    '┌──────────────────┬────────┬─────────┬────────┬──────────┐',
    '│ Module namespace │ Facade │ Factory │ Config │ Provider │',
    '├──────────────────┼────────┼─────────┼────────┼──────────┤',
    '│ Phel\\Api         │ x      │ x       │ x      │ x        │',
    '│ Phel\\Balance     │ x      │ x       │ x      │ x        │',
    '│ Phel\\Build       │ x      │ x       │ x      │ x        │',
    '│ Phel\\Command     │ x      │ x       │ x      │ x        │',
    '│ Phel\\Compiler    │ x      │ x       │ x      │ x        │',
    '│ Phel\\Console     │ x      │ x       │        │ x        │',
    '│ Phel\\Fiber       │ x      │ x       │ x      │          │',
    '│ Phel\\Filesystem  │ x      │ x       │ x      │          │',
    '│ Phel\\Formatter   │ x      │ x       │ x      │ x        │',
    '│ Phel\\Interop     │ x      │ x       │ x      │ x        │',
    '│ Phel\\Lint        │ x      │ x       │ x      │ x        │',
    '│ Phel\\Lsp         │ x      │ x       │ x      │ x        │',
    '│ Phel\\Mutate      │ x      │ x       │ x      │ x        │',
    '│ Phel\\Nrepl       │ x      │ x       │ x      │ x        │',
    '│ Phel\\Profile     │ x      │ x       │ x      │ x        │',
    '│ Phel\\Run         │ x      │ x       │ x      │ x        │',
    '│ Phel\\Watch       │ x      │ x       │ x      │ x        │',
    '└──────────────────┴────────┴─────────┴────────┴──────────┘',
  ].join('\n'),
}

export const debugGraph: TerminalSession = {
  command: 'vendor/bin/gacela debug:graph',
  source,
  output: [
    '…',
    'Phel\\Console (14)',
    '  -> Phel\\Api',
    '  -> Phel\\Balance',
    '  -> Phel\\Build',
    '  -> Phel\\Compiler',
    '…',
    'Phel\\Fiber (0)',
    'Phel\\Filesystem (0)',
    '…',
  ].join('\n'),
}

export const debugModule: TerminalSession = {
  command: "vendor/bin/gacela debug:module 'Phel\\Run'",
  source,
  output: [
    'Module: Run',
    '  Facade    → Phel\\Run\\RunFacade',
    '  Factory   → Phel\\Run\\RunFactory',
    '  Config    → Phel\\Run\\RunConfig',
    '  Provider  → Phel\\Run\\RunProvider',
    '  Provides (#[Provides]):',
    '    Phel\\Shared\\Facade\\ApiFacadeInterface',
    '    Phel\\Shared\\Facade\\BuildFacadeInterface',
    '    Phel\\Shared\\Facade\\CommandFacadeInterface',
    '    Phel\\Shared\\Facade\\CompilerFacadeInterface',
    '    Phel\\Shared\\Facade\\FilesystemFacadeInterface',
    '…',
  ].join('\n'),
}

export const doctor: TerminalSession = {
  command: 'vendor/bin/gacela doctor',
  source,
  wrap: true,
  output: [
    '…',
    '✓ suffix configuration',
    '    17 module(s) use configured suffixes',
    '',
    '✓ class filenames',
    '    every pillar class matches its filename',
    '',
    '…',
    '⚠ package manifests',
    '    phel-lang/phel-lang imports Symfony\\Component\\Finder\\SplFileInfo, provided by symfony/finder, which its composer.json never mentions',
    '    → add it to `require`, or to `suggest` when the dependency is optional by design',
    '…',
    '⚠ Doctor finished with warnings',
  ].join('\n'),
}
