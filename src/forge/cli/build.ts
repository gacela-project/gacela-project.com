import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { build } from '../pipeline.ts'
import { loadSiteConfig, projectRoot, readVersion } from './context.ts'

const root = projectRoot()
const started = performance.now()

const site = await loadSiteConfig(root)
const version = await readVersion(root)

const result = await build({ site, root, version })

const outDir = join(root, 'dist')
await rm(outDir, { recursive: true, force: true })

await Promise.all(
  result.outputs.map(async (output) => {
    const destination = join(outDir, output.path)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, output.contents)
  }),
)

const bytes = result.outputs.reduce(
  (total, output) => total + (typeof output.contents === 'string'
    ? Buffer.byteLength(output.contents)
    : output.contents.byteLength),
  0,
)

const elapsed = Math.round(performance.now() - started)

console.log(
  `Built ${result.pages.length} pages and ${result.outputs.length} files ` +
    `(${(bytes / 1024).toFixed(0)} KB) in ${elapsed}ms`,
)
