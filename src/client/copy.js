/**
 * Copy buttons, and confirmation for any copy taken from a code block.
 *
 * The buttons are rendered server side but only become useful here, so they
 * stay hidden until the document is marked as scripted.
 *
 * Two paths lead to the clipboard and both are confirmed. Pressing the button
 * writes through the clipboard API, which fires no copy event of its own.
 * Selecting code and pressing the platform's copy shortcut fires a real copy
 * event that this file does not interfere with, only observes.
 */

const CONFIRM_MS = 1600

/** Blocks currently showing a confirmation, so a repeat copy can restart it. */
const pending = new WeakMap()

document.addEventListener('click', async (event) => {
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

  const block = button.closest('.code-block, .code-group, .hero__install')
  if (block) flash(block)
})

/**
 * A copy the reader made themselves, by selecting text and using the keyboard.
 * The block still flashes, because the question "what did I just take" is the
 * same one either way.
 */
document.addEventListener('copy', () => {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const anchor = selection.anchorNode
  const element = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement
  const block = element?.closest?.('.code-block, .code-group')

  if (block) flash(block)
})

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

/**
 * Restarts the flash rather than leaving it mid-run. Removing the attribute is
 * not enough on its own: the browser coalesces the removal and the re-add into
 * one style recalculation and the animation never restarts, so the pending
 * change is flushed in between.
 */
function flash(block) {
  block.removeAttribute('data-copied')
  void block.offsetWidth
  block.setAttribute('data-copied', '')

  clearTimeout(pending.get(block))
  pending.set(
    block,
    setTimeout(() => block.removeAttribute('data-copied'), CONFIRM_MS),
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
