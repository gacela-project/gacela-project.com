import { describe, expect, it } from 'vitest'

const client = await import(new URL('../../src/client/video.js', import.meta.url).href)

const embedSrc = client.embedSrc as (id: string | undefined) => string | null

describe('embedSrc', () => {
  it('plays the video from the no-cookie host, straight away', () => {
    expect(embedSrc('lzhg6-nuTVM')).toBe(
      'https://www.youtube-nocookie.com/embed/lzhg6-nuTVM?autoplay=1',
    )
  })

  it('refuses anything that is not a YouTube video id', () => {
    expect(embedSrc(undefined)).toBeNull()
    expect(embedSrc('')).toBeNull()
    expect(embedSrc('lzhg6-nuTVM?list=x')).toBeNull()
    expect(embedSrc('../../evil')).toBeNull()
  })
})
