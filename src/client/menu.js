/**
 * The header's Reference menu.
 *
 * A details element already opens, closes, and tells a screen reader which it
 * is. What it does not do is close when you press Escape or click somewhere
 * else, which is what everyone expects of a menu. That is all this adds, so
 * with scripts disabled the menu still works, just less politely.
 */

function init() {
  const menus = document.querySelectorAll('[data-header-menu]')
  if (menus.length === 0) return

  const closeAll = (except) => {
    for (const menu of menus) if (menu !== except) menu.open = false
  }

  document.addEventListener('click', (event) => {
    const target = event.target
    const inside = target instanceof Element ? target.closest('[data-header-menu]') : null

    /* A click on a link inside closes it too: the page is about to change, and
       leaving the panel open behind the navigation looks like a stuck menu. */
    if (inside !== null && target instanceof Element && target.closest('a') === null) {
      closeAll(inside)
      return
    }

    closeAll(null)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return

    for (const menu of menus) {
      if (!menu.open) continue

      menu.open = false
      /* Focus would otherwise be left on an element that is now hidden. */
      menu.querySelector('summary')?.focus()
    }
  })
}

/* Module scripts are deferred, so the markup this needs is already parsed. */
if (typeof document !== 'undefined') init()
