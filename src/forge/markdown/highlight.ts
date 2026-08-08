import { createCssVariablesTheme, createHighlighter, type HighlighterGeneric } from 'shiki'

/**
 * Syntax highlighting.
 *
 * The theme is driven entirely by CSS variables, which means the code palette
 * is defined in src/design/tokens.css alongside every other colour on the site
 * rather than imported from a stock editor theme. It also means light and dark
 * need no second pass: the same markup responds to both.
 */

const THEME_NAME = 'facet'

/** Every language any content file uses, plus the ones a contributor will reach for. */
const LANGUAGES = [
  'php',
  'bash',
  'json',
  'yaml',
  'xml',
  'html',
  'css',
  'js',
  'ts',
  'ini',
  'sql',
  'diff',
  'docker',
  'text',
] as const

export type Highlighter = {
  /** Returns `<pre class="shiki">...</pre>`, already escaped. */
  highlight(code: string, language: string): string
  supports(language: string): boolean
}

export async function createSyntaxHighlighter(): Promise<Highlighter> {
  const theme = createCssVariablesTheme({
    name: THEME_NAME,
    variablePrefix: '--syn-',
    variableDefaults: {},
    fontStyle: true,
  })

  const shiki: HighlighterGeneric<never, never> = await createHighlighter({
    themes: [theme],
    langs: [...LANGUAGES],
  })

  const loaded = new Set(shiki.getLoadedLanguages())

  return {
    supports: (language) => loaded.has(language),
    highlight(code, language) {
      // An unknown language still gets a frame and escaping, just no colour.
      const lang = loaded.has(language) ? language : 'text'

      return shiki.codeToHtml(code, { lang, theme: THEME_NAME })
    },
  }
}
