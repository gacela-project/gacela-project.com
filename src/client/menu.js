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

  /* Pointing at the menu opens it, which is what a menu in a bar like this is
     expected to do. Only where pointing is a thing that exists: on a touch
     screen the tap would open it and the click behind it would close it again,
     so those devices keep the plain details behaviour. */
  const pointerOpens = window.matchMedia('(hover: hover)').matches

  if (pointerOpens) {
    for (const menu of menus) {
      menu.addEventListener('mouseenter', () => {
        menu.open = true
      })
      menu.addEventListener('mouseleave', () => {
        menu.open = false
      })

      /* Arriving at the summary has already opened it, so the click that
         usually follows would shut it again the moment it appeared. Only a
         real click is ignored: keyboard activation reports no click count,
         and still needs to work the way a details element always does. */
      menu.querySelector('summary')?.addEventListener('click', (event) => {
        if (event.detail > 0) event.preventDefault()
      })
    }
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

/**
 * The mobile drawer. It covers the viewport when open, which the platform does
 * not account for: Escape does not close it, and Tab walks out of the panel
 * onto the page behind it.
 *
 * Everything outside is inert while it is open, driven by the toggle event so
 * the flag cannot be left behind.
 */
function initDrawer() {
  const drawer = document.querySelector('[data-nav-drawer]')
  const bar = drawer?.closest('.header__inner')
  const header = drawer?.closest('header')

  /* Without both ancestors the filters below would inert the header, and with
     it the drawer inside: the panel would open and refuse every key. */
  if (drawer === null || bar === undefined || header === undefined) return

  const outside = () => [
    /* Not the dialog: showModal() handles its own inertness, and marking it
       here would break the search button the drawer offers. */
    ...Array.from(document.body.children).filter(
      (element) => element !== header && element.tagName !== 'DIALOG',
    ),
    ...Array.from(bar.children).filter((element) => element !== drawer),
  ]

  drawer.addEventListener('toggle', () => {
    for (const element of outside()) element.inert = drawer.open
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !drawer.open) return

    drawer.open = false
    for (const element of outside()) element.inert = false
    /* Focus would otherwise be left on an element that is now hidden. */
    drawer.querySelector('summary')?.focus()
  })
}

/* Module scripts are deferred, so the markup this needs is already parsed. */
if (typeof document !== 'undefined') {
  init()
  initDrawer()
}
