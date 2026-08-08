/**
 * Theme control.
 *
 * The stored preference is applied by the inline script in the head, before
 * first paint. This file only keeps the toggle in step with it: it reflects
 * the current choice into the radio group and writes changes back.
 *
 * "system" is the default and is represented by the absence of data-theme,
 * which is what lets the light-dark() tokens follow the operating system with
 * no JavaScript involved at all.
 */

const root = document.documentElement
const toggle = document.querySelector('[data-theme-toggle]')

if (toggle) {
  const stored = read()

  for (const input of toggle.querySelectorAll('input[name="theme"]')) {
    input.checked = input.value === stored
    input.closest('.theme-toggle__option')?.toggleAttribute('data-selected', input.checked)
  }

  toggle.addEventListener('change', (event) => {
    const input = event.target
    if (!(input instanceof HTMLInputElement)) return

    apply(input.value)

    for (const option of toggle.querySelectorAll('.theme-toggle__option')) {
      option.toggleAttribute('data-selected', option.contains(input))
    }
  })
}

function read() {
  try {
    const value = localStorage.getItem('theme')
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function apply(value) {
  if (value === 'system') {
    delete root.dataset.theme
  } else {
    root.dataset.theme = value
  }

  try {
    if (value === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', value)
  } catch {
    /* Private browsing denies storage; the choice still applies for this page. */
  }
}
