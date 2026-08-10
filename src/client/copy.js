/**
 * Copy buttons, and confirmation for the copy they take.
 *
 * The buttons are rendered server side but only become useful here, so they
 * stay hidden until the document is marked as scripted.
 *
 * The confirmation is the button's own: its icon becomes a tick. The block is
 * left alone. Nothing else on the page moves when a reader takes a copy, and a
 * copy is the one thing they are certain of having asked for, so lighting up
 * the whole block to report it is louder than the event deserves.
 *
 * That leaves the keyboard alone as well. Selecting code and pressing the
 * platform's copy shortcut is answered by the platform.
 */

const CONFIRM_MS = 1600

/** Buttons currently showing a tick, so a repeat copy can restart it. */
const pending = new WeakMap()

document.addEventListener('click', async (event) => {
  const markdown = event.target instanceof Element ? event.target.closest('[data-copy-markdown]') : null
  if (markdown) {
    await copyMarkdown(markdown)
    return
  }

  const button = event.target instanceof Element ? event.target.closest('[data-copy]') : null
  if (!button) return

  const text = resolveText(button)
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard access can be refused. Saying nothing is better than claiming
    // a copy that did not happen.
    return
  }

  confirmOn(button)
})

/**
 * The page's markdown lives in a file next to it, so the copy is a fetch. The
 * label reports the result: it is the only thing on the control that a reader
 * scanning the margin will read.
 */
async function copyMarkdown(button) {
  const source = button.getAttribute('data-markdown-src')
  const label = button.querySelector('.copy-md__label')
  if (!source || !label) return

  try {
    const response = await fetch(source)
    if (!response.ok) throw new Error(String(response.status))
    await navigator.clipboard.writeText(await response.text())
  } catch {
    // Either the file did not arrive or the clipboard was refused. Claiming a
    // copy that did not happen would be worse than saying nothing.
    return
  }

  button.setAttribute('data-copied', '')
  label.textContent = 'Copied'

  clearTimeout(pending.get(button))
  pending.set(
    button,
    setTimeout(() => {
      button.removeAttribute('data-copied')
      label.textContent = 'Copy as markdown'
    }, CONFIRM_MS),
  )
}

function confirmOn(button) {
  button.setAttribute('data-copied', '')
  button.setAttribute('aria-label', 'Copied to clipboard')

  clearTimeout(pending.get(button))
  pending.set(
    button,
    setTimeout(() => {
      button.removeAttribute('data-copied')
      button.setAttribute('aria-label', defaultLabel(button))
    }, CONFIRM_MS),
  )
}

function defaultLabel(button) {
  return button.closest('.hero__install')
    ? 'Copy the install command'
    : 'Copy code to clipboard'
}

function resolveText(button) {
  const labelled = button.parentElement?.querySelector('[data-copy-text]')
  if (labelled) return labelled.textContent?.trim() ?? ''

  const code = button.closest('.code-block')?.querySelector('code')
  return code?.textContent?.replace(/\n$/, '') ?? ''
}
