/**
 * Search. The <dialog> gives us focus trapping, Escape and the backdrop, and results
 * are links, so what is left here is scoring, excerpts, arrow keys and dismissing on
 * a backdrop click. The index is fetched when the dialog first opens, never on page load.
 */

const INDEX_URL = '/search-index.json'
const MAX_RESULTS = 8
const LEAD = 60
const WINDOW = 200
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c])
const norm = (v) => String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
const cell = (name, html) => `<div class="search-result__${name}">${html}</div>`

/** The phrase and its words, longest first, so a phrase wins over the words inside it. */
export function queryTerms(query) {
  const phrase = norm(query)
  if (!phrase) return []
  const words = phrase.split(' ')
  return (words.length > 1 ? [phrase, ...words] : words).sort((a, b) => b.length - a.length)
}

/**
 * Tiers, not arithmetic: a title that says what you typed beats a paragraph that
 * happens to contain the same words. The bonus only reorders inside one tier.
 */
export function scoreDocument(doc, query) {
  const phrase = norm(query)
  if (!phrase) return 0

  const words = phrase.split(' ')
  const title = norm(doc.title)
  const both = `${title} ${norm(doc.text)}`
  let score

  if (title === phrase) score = 120
  else if (title.startsWith(phrase)) score = 100
  else if (title.includes(phrase)) score = 85
  else if (words.every((w) => title.includes(w))) score = 65
  else if (both.includes(phrase)) score = 50
  else if (words.every((w) => both.includes(w))) score = 35
  else {
    const hits = words.filter((w) => both.includes(w)).length
    if (!hits) return 0
    score = 10 + Math.min(hits, 3) * 3
  }
  return score + Math.max(0, 8 - title.length / 12)
}

export function searchDocuments(docs, query, limit = MAX_RESULTS) {
  return docs
    .map((doc) => [scoreDocument(doc, query), doc])
    .filter(([score]) => score > 0)
    .sort((a, b) => b[0] - a[0])
    .slice(0, limit)
    .map(([, doc]) => doc)
}

function highlight(text, terms) {
  if (!terms.length || !text) return esc(text)
  const re = new RegExp(terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi')
  let html = ''
  let last = 0
  for (const m of text.matchAll(re)) {
    html += `${esc(text.slice(last, m.index))}<mark>${esc(m[0])}</mark>`
    last = m.index + m[0].length
  }
  return html + esc(text.slice(last))
}

/** Escaped HTML, matched terms in <mark>, windowed around the first match. */
export function excerptHtml(text, query) {
  const src = String(text ?? '')
  const terms = queryTerms(query)
  const lower = src.toLowerCase()
  let at = -1
  for (const term of terms) if ((at = lower.indexOf(term)) > -1) break

  const from = at > LEAD ? src.lastIndexOf(' ', at - LEAD) + 1 : 0
  const end = from + WINDOW
  const to = end >= src.length ? src.length : Math.max(src.lastIndexOf(' ', end), from + 40)
  return (from ? '…' : '') + highlight(src.slice(from, to).trim(), terms) + (to < src.length ? '…' : '')
}

const isTyping = (el) =>
  !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || '') || el.isContentEditable === true)

function init() {
  const dialog = document.querySelector('[data-search-dialog]')
  if (!dialog || typeof dialog.showModal !== 'function') return

  const part = (name) => dialog.querySelector(`.search-dialog__${name}`)
  const input = part('input')
  const results = part('results')
  if (!input || !results) return

  const empty = part('empty')
  const status = document.querySelector('[data-search-status]')
  let index, pending, active = 0

  /* A search box that cannot search must not look like one. */
  document.documentElement.dataset.js = ''

  /* The trigger is rendered with the Apple shortcut, since the platform is only
     knowable here. Both modifiers open the dialog either way; this is the label. */
  const hint = document.querySelector('[data-search-hint]')
  if (hint && !/mac|iphone|ipad|ipod/i.test(navigator.userAgent)) hint.textContent = 'Ctrl K'

  /* Held as a promise, so opening twice mid-flight does not fetch twice. */
  const load = () =>
    (pending ??= fetch(INDEX_URL)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => (index = Array.isArray(data) ? data : [])))

  function setActive(next) {
    const items = results.querySelectorAll('a')
    if (!items.length) return
    active = (next + items.length) % items.length
    items.forEach((item, i) => item.toggleAttribute('data-active', i === active))
    items[active].scrollIntoView({ block: 'nearest' })
  }

  function update() {
    if (!index) return void load().then(update)

    const query = input.value.trim()
    const terms = queryTerms(query)
    const hits = query ? searchDocuments(index, query) : []
    active = 0

    results.innerHTML = hits
      .map((doc, i) =>
        `<li><a class="search-result" href="${esc(doc.route)}"${i ? '' : ' data-active'}>` +
        cell('crumb', esc(doc.crumb)) +
        cell('title', highlight(String(doc.title ?? ''), terms)) +
        cell('excerpt', excerptHtml(doc.text, query)) +
        '</a></li>')
      .join('')

    if (empty) empty.hidden = !query || hits.length > 0
    if (status) status.textContent = query ? `${hits.length} result${hits.length === 1 ? '' : 's'}` : ''
  }

  function open() {
    if (dialog.open) return
    dialog.showModal()
    input.focus()
    input.select()
    update()
  }

  document.querySelectorAll('[data-search-trigger]').forEach((el) => el.addEventListener('click', open))
  part('close')?.addEventListener('click', () => dialog.close())
  input.addEventListener('input', update)

  /* Escape is the dialog's own doing. Enter inside a form is not. */
  dialog.addEventListener('submit', (event) => event.preventDefault())

  /* The backdrop is not: a click on it targets the dialog element, which nothing
     else can do since the dialog has no padding of its own. Both ends of the click
     must land there, or selecting text in the input and releasing outside closes it. */
  let fromBackdrop = false
  dialog.addEventListener('mousedown', (event) => {
    fromBackdrop = event.target === dialog
  })
  dialog.addEventListener('click', (event) => {
    if (fromBackdrop && event.target === dialog) dialog.close()
  })

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return
    const key = event.key
    const meta = event.metaKey || event.ctrlKey

    if (!dialog.open) {
      if ((meta && key.toLowerCase() === 'k') || (key === '/' && !meta && !event.altKey && !isTyping(event.target))) {
        event.preventDefault()
        open()
      }
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault()
      setActive(active + (key === 'ArrowUp' ? -1 : 1))
    } else if (key === 'Enter') {
      const current = results.querySelector('[data-active]')
      if (!current) return
      event.preventDefault()
      dialog.close()
      location.assign(current.href)
    } else if (key === 'Escape') {
      /* The dialog would do this itself, but a type="search" input eats the first Escape. */
      dialog.close()
    }
  })
}

/* Module scripts are deferred, so the markup this needs is already parsed. */
if (typeof document !== 'undefined') init()
