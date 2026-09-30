/**
 * Click-to-load video.
 *
 * The page ships a poster and a plain link to YouTube, so without script the
 * video opens there. With script, pressing play swaps the link for the player,
 * and that is the first request YouTube sees from the page.
 */

const VIDEO_ID = /^[\w-]{11}$/

export function embedSrc(id) {
  return id && VIDEO_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : null
}

function play(event) {
  const link = event.target instanceof Element ? event.target.closest('[data-video]') : null
  if (!link) return
  /* A modified click means the reader asked for a new tab, and gets one. */
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const src = embedSrc(link.dataset.video)
  if (!src) return
  event.preventDefault()

  const frame = document.createElement('iframe')
  frame.className = 'video'
  frame.src = src
  frame.title = link.dataset.videoTitle ?? ''
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
  frame.referrerPolicy = 'strict-origin-when-cross-origin'
  frame.allowFullscreen = true
  link.replaceWith(frame)
  frame.focus()
}

if (typeof document !== 'undefined') document.addEventListener('click', play)
