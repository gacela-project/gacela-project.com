import { escapeHtml } from '../markdown/index.ts'

/**
 * A tagged template for HTML that escapes what is interpolated into it.
 *
 * The site has no template engine, so this is the safety net: everything that
 * goes through `html` is escaped unless it is explicitly marked raw, which
 * makes the unsafe case the one you have to type out.
 */

const RAW = Symbol('raw')

export type Raw = { readonly [RAW]: string }

export type Renderable = Raw | string | number | boolean | null | undefined | readonly Renderable[]

export function raw(value: string): Raw {
  return { [RAW]: value }
}

export function isRaw(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && RAW in value
}

export function html(strings: TemplateStringsArray, ...values: readonly Renderable[]): Raw {
  const parts: string[] = []

  strings.forEach((chunk, index) => {
    parts.push(chunk)
    if (index < values.length) parts.push(stringify(values[index]))
  })

  return raw(parts.join(''))
}

function stringify(value: Renderable): string {
  if (value === null || value === undefined || value === false || value === true) return ''
  if (isRaw(value)) return value[RAW]
  if (Array.isArray(value)) return value.map(stringify).join('')

  return escapeHtml(String(value))
}

/** Unwraps a template into the string that gets written to disk. */
export function render(value: Renderable): string {
  return stringify(value)
}

export function classes(...names: readonly (string | false | null | undefined)[]): string {
  return names.filter((name): name is string => typeof name === 'string' && name !== '').join(' ')
}

/**
 * Renders a set of attributes, dropping the ones that are absent.
 *
 * The result is markup rather than text, so it is Raw: interpolating a plain
 * string here would escape the quotes and silently produce a dead attribute.
 */
export function attrs(
  map: Readonly<Record<string, string | number | boolean | null | undefined>>,
): Raw {
  return raw(
    Object.entries(map)
      .filter(([, value]) => value !== null && value !== undefined && value !== false)
      .map(([name, value]) =>
        value === true ? ` ${name}` : ` ${name}="${escapeHtml(String(value))}"`,
      )
      .join(''),
  )
}
