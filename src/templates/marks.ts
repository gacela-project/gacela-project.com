import { html, raw, type Raw } from '../forge/render/index.ts'

/**
 * The Gacela mark: a gazelle assembled from twenty-six triangular facets.
 *
 * It is drawn inline rather than loaded as an image for two reasons. It
 * inherits `currentColor`, so one mark serves both themes instead of shipping a
 * light file and a dark file. And each facet is addressable, which is what lets
 * the home page draw the animal on piece at a time: an application built from
 * modules, assembling itself.
 */
const FACETS: readonly string[] = [
  'M5.9,287.9 24.8,229.5 58.4,205.4 43.6,242z',
  'M12.6,462.5 29.1,442.1 32,469.2z',
  'M27.1,330.5 33.9,345.4 50.4,346.9 29.1,442.1 12.6,462.5z',
  'M55.4,262.7 83.5,217.2 147.9,214.9 120.9,292.2 50.4,346.9 33.9,345.4 27.1,330.5z',
  'M58.4,205.4 83.5,217.2 55.4,262.7 43.6,242z',
  'M71.9,343.9 98.8,348.1 111,439.2 103.6,461.9z',
  'M111,439.2 121.9,461.9 103.6,461.9z',
  'M120.9,292.2 218.8,302.7 229.3,267.4 264.4,232.2 147.9,214.9z',
  'M144.5,294.9 120.9,292.2 71.9,330.3 71.9,343.9 98.8,348.1z',
  'M176.9,467.3 195.1,448 228.7,367.2 207.6,367.2 202.8,356.8z',
  'M176.9,467.7 195.1,448 199.1,472.5z',
  'M202.8,356.8 229.3,267.4 264.4,232.2 285.5,273.2 228.7,367.2 207.6,367.2z',
  'M272.3,16.2 376.8,61.5 405.4,106.3 390.4,136.3 383.5,132.1 384.6,121.9 363.5,68.7z',
  'M293.1,9.4 386.3,60.6 412.3,101.7 405.4,106.3 376.8,61.5 340.4,45.7z',
  'M302.9,177.3 147.9,214.9 83.5,217.2 58.4,205.4 133.5,179.7z',
  'M302.9,177.3 379.2,108.2 384.6,121.9 383.5,132.1 390.4,136.3 338.1,192.9z',
  'M303.3,368.6 274.2,297.1 310,267.1 325.5,351.3z',
  'M325.5,351.3 354.6,445.2 344.4,462.2 303.3,368.6z',
  'M338.1,192.9 264.4,232.2 147.9,214.9 302.9,177.3z',
  'M344.4,462.2 354.6,445.2 362.3,462.2z',
  'M365.3,220.7 267.6,302.7 285.5,273.2 264.4,232.2 338.1,192.9z',
  'M365.3,220.7 410.9,165.5 390.4,136.3 338.1,192.9z',
  'M390.4,136.3 383.5,132.1 389.4,78.9 400.3,116.6z',
  'M410.9,165.5 475.6,166.2 390.4,136.3z',
  'M412.3,101.7 433,124.8 482.2,151.3 475.6,166.2 390.4,136.3 405.4,106.3z',
  'M414.5,77 409.2,96.7 405.6,91z',
]

/** Neck, back and haunch: the facets that settle into the accent colour. */
const ACCENT_FACETS = new Set([14, 18, 20])

export function gacelaMark(options: { animated?: boolean; className?: string } = {}): Raw {
  const paths = FACETS.map((d, index) =>
    raw(
      `<path d="${d}" pathLength="1" style="--facet:${index}"${
        ACCENT_FACETS.has(index) ? ' data-accent' : ''
      }/>`,
    ),
  )

  return html`<svg
    class="mark ${options.animated === true ? 'mark--animated' : ''} ${options.className ?? ''}"
    viewBox="0 0 500 480"
    fill="none"
    aria-hidden="true"
  >
    ${paths}
  </svg>`
}
