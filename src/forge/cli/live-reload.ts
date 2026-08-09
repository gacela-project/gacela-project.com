/**
 * Browser reload for the development server, and nowhere else.
 *
 * The dev server already rebuilds the whole site on every change; this is the
 * other half, the part that tells the page sitting in the browser that a newer
 * one exists. It lives in cli/ because it is a property of running the site
 * locally, not of the site: the pipeline never emits it, so a built page cannot
 * carry it into production by accident.
 *
 * The page asks rather than being told. A push would need the response held
 * open, and the server that holds it is the same one that serves the built site
 * in preview, which is deliberately no more than a static host. Asking costs a
 * request every fifth of a second against a number already in memory, and keeps
 * that server exactly as plain as production's.
 */

/**
 * Where the running generation is served. It carries an extension because the
 * static server reads an extensionless URL as a page and would look for
 * "dev-generation.html" instead.
 */
export const GENERATION_PATH = 'dev-generation.txt'

const POLL_MS = 200

/**
 * The reload watcher.
 *
 * It remembers the generation it first saw and reloads when the server reports
 * a different one. A failed request means the server is restarting, so it keeps
 * asking: when the server returns its generation starts over, which reads as a
 * change and reloads the page onto the new build.
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
