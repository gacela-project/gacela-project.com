/**
 * Heading slugs.
 *
 * These are public URLs: every `#anchor` link anyone has ever shared depends on
 * this function producing the same answer it produced before. The rules match
 * what the previous site published, and changing them is a breaking change.
 */
export function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    // Strip the combining marks left behind by NFKD, so "Jesús" becomes "Jesus".
    .replace(/[̀-ͯ]/g, '')
    .replace(/`/g, '')
    // Markdown links keep their label and lose their target.
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug === '' ? 'section' : slug
}

/**
 * A slugger scoped to one page, which suffixes repeats so that two headings
 * with the same words still get two distinct anchors.
 */
export function createSlugger(): (text: string) => string {
  const used = new Map<string, number>()

  return (text: string): string => {
    const base = slugify(text)
    const count = used.get(base) ?? 0

    used.set(base, count + 1)

    return count === 0 ? base : `${base}-${count}`
  }
}
