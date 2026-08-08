/**
 * Copy buttons for code blocks and the install command.
 *
 * The buttons are rendered server side but only become useful here, so they
 * are hidden until the document is marked as scripted.
 */

document.addEventListener('click', async (event) => {
  const button = event.target instanceof Element ? event.target.closest('[data-copy]') : null
  if (!button) return

  const text = resolveText(button)
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
  } catch {
    return
  }

  button.setAttribute('data-copied', '')
  button.setAttribute('aria-label', 'Copied')

  setTimeout(() => {
    button.removeAttribute('data-copied')
    button.setAttribute('aria-label', 'Copy code to clipboard')
  }, 1600)
})

function resolveText(button) {
  const labelled = button.parentElement?.querySelector('[data-copy-text]')
  if (labelled) return labelled.textContent?.trim() ?? ''

  const code = button.closest('.code-block')?.querySelector('code')
  return code?.textContent?.replace(/\n$/, '') ?? ''
}
