/**
 * Marks the table of contents entry for the section currently being read.
 *
 * An IntersectionObserver watching a band near the top of the viewport is
 * enough: it tracks which headings are above the reading line and highlights
 * the last of them, which is what a reader intuitively expects.
 */

const links = [...document.querySelectorAll('[data-toc-link]')]

if (links.length > 0 && 'IntersectionObserver' in window) {
  const byId = new Map(links.map((link) => [decodeURIComponent(link.hash.slice(1)), link]))
  const headings = [...byId.keys()]
    .map((id) => document.getElementById(id))
    .filter((element) => element !== null)

  const passed = new Set()

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.boundingClientRect.top < entry.rootBounds?.top + 1) passed.add(entry.target.id)
        else if (!entry.isIntersecting) passed.delete(entry.target.id)
        if (entry.isIntersecting) passed.add(entry.target.id)
      }

      const active = headings.filter((heading) => passed.has(heading.id)).at(-1) ?? headings[0]

      for (const [id, link] of byId) link.toggleAttribute('data-active', id === active?.id)
    },
    { rootMargin: '-72px 0px -70% 0px', threshold: 0 },
  )

  for (const heading of headings) observer.observe(heading)
}
