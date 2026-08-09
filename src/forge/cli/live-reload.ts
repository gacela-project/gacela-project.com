/**
 * Browser reload for the development server, and nowhere else. It lives in cli/
 * so the pipeline never emits it and a built page cannot carry it to production.
 *
 * The page polls rather than being pushed to: a push needs the response held
 * open, and the same server serves the built site in preview, where it is meant
 * to be no more than a static host.
 */

/** Extensioned, or the static server reads it as a page and looks for .html. */
export const GENERATION_PATH = 'dev-generation.txt'

const POLL_MS = 200

/**
 * Remembers the generation it first saw and reloads when the server reports
 * another. A failed request means the server is restarting, so it keeps asking:
 * the generation starts over on return, which reads as a change.
 */
const SCRIPT = `<script>
(() => {
  let seen = null;
  const ask = async () => {
    try {
      const response = await fetch('/${GENERATION_PATH}', { cache: 'no-store' });
      const generation = await response.text();
      if (seen === null) seen = generation;
      else if (generation !== seen) return location.reload();
    } catch (error) {}
    setTimeout(ask, ${POLL_MS});
  };
  ask();
})();
</script>`

/** The page with the watcher added, last in the body so it costs the page nothing. */
export function injectLiveReload(html: string): string {
  const index = html.lastIndexOf('</body>')

  if (index === -1) return html + SCRIPT

  return html.slice(0, index) + SCRIPT + html.slice(index)
}
