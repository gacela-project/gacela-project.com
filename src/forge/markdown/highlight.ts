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

/**
 * Rewrites Shiki's inline styles as classes.
 *
 * Shiki emits `style="color:var(--syn-token-keyword)"` on every token, which on
 * a long documentation page is tens of kilobytes of the same few strings. The
 * colours are already design tokens, so the mapping can live in one CSS rule
 * per token type and each span can carry a short class instead. On the longest
 * page this removes about a third of the HTML.
 *
 * Exported so the rewrite is tested directly rather than through a build.
 */
export function tokensToClasses(html: string): string {
  return html
    .replace(/ style="color:var\(--syn-token-([a-z-]+)\)"/g, ' class="syn-$1"')
    .replace(/ style="color:var\(--syn-foreground\)"/g, '')
    .replace(/ style="background-color:var\(--syn-background\);color:var\(--syn-foreground\)"/g, '')
    // Removing the style leaves bare wrappers around plain text. Shiki's token
    // spans never nest, so unwrapping them is a straight substitution.
    .replace(/<span>([^<]*)<\/span>/g, '$1')
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

      return tokensToClasses(shiki.codeToHtml(code, { lang, theme: THEME_NAME }))
    },
  }
}
