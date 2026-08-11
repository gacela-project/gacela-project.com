/**
 * The data that flows through the build.
 *
 * Every module in src/forge takes one of these shapes and returns another, so
 * this file is the contract between them and the only thing they all import.
 */

export type Collection = 'docs' | 'pages'

export type Frontmatter = {
  readonly title?: string
  readonly description?: string
  readonly layout?: string
  /** Excluded from the search index and the sitemap when true. */
  readonly unlisted?: boolean
}

/** A content file, parsed but not yet rendered. */
export type Page = {
  /** Path relative to content/, used in messages so they point at a real file. */
  readonly source: string
  readonly collection: Collection
  /** Final URL path, always absolute and without a trailing slash except "/". */
  readonly route: string
  /**
   * The archived docs line this page belongs to ("1.x"), or undefined for the
   * current documentation and every non-doc page. Archived pages are built and
   * link-checked but stay out of the search index, the sitemap and the agent
   * context files: they exist to be read, not to be recommended.
   */
  readonly version?: string | undefined
  readonly frontmatter: Frontmatter
  /** Markdown body with the frontmatter block removed. */
  readonly body: string
}

export type Heading = {
  readonly depth: number
  readonly id: string
  readonly text: string
}

/** A page whose markdown has been turned into HTML. */
export type RenderedPage = Page & {
  readonly html: string
  readonly headings: readonly Heading[]
  /** Body text with markup stripped, for the search index and excerpts. */
  readonly text: string
  /** Internal links found in the body, for the link checker. */
  readonly links: readonly string[]
}

/** One entry in the documentation sidebar. */
export type NavLink = {
  readonly title: string
  readonly route: string
}

export type NavGroup = {
  readonly title: string
  readonly items: readonly NavLink[]
}

/** A sidebar rendered for one specific page. */
export type NavState = {
  readonly groups: readonly NavGroup[]
  readonly current: NavLink | undefined
  readonly previous: NavLink | undefined
  readonly next: NavLink | undefined
  readonly groupTitle: string | undefined
}

/** Where the version switcher's entries lead from one specific page. */
export type VersionTargets = {
  readonly current: string
  readonly byArchive: Readonly<Record<string, string>>
}

export type SearchDocument = {
  readonly route: string
  readonly title: string
  readonly crumb: string
  readonly text: string
}

/** A file the build is going to write, addressed by its path inside dist/. */
export type Output = {
  readonly path: string
  readonly contents: string | Uint8Array
}

/**
 * A frozen documentation line: the docs as they stood at the last release of
 * an old major. Its content lives under content/docs/<version>/ and is never
 * edited after the snapshot; only its presentation stays alive.
 */
export type DocsArchive = {
  /** The route segment and content directory name, e.g. "1.x". */
  readonly version: string
  /** What the version switcher prints, e.g. "1.21.0". */
  readonly label: string
  readonly sidebar: readonly NavGroup[]
}

export type SiteConfig = {
  readonly title: string
  readonly tagline: string
  readonly description: string
  readonly origin: string
  readonly repository: string
  /** This website's own repository, used for the edit-on-GitHub links. */
  readonly siteRepository: string
  readonly packagist: string
  readonly social: readonly { readonly label: string; readonly href: string }[]
  readonly headerLinks: readonly NavLink[]
  readonly sidebar: readonly NavGroup[]
  /** Frozen documentation lines, newest first. Absent while there are none. */
  readonly archives?: readonly DocsArchive[]
  /** Old path to new path. Emitted as meta-refresh pages with canonical links. */
  readonly redirects: Readonly<Record<string, string>>
}
