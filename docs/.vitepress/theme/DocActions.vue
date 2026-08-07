<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData, useRoute } from 'vitepress'
import { docsGroups } from '../docs-manifest.mjs'

const { frontmatter } = useData()
const route = useRoute()
const status = ref('')

const visible = computed(() => frontmatter.value.layout !== 'home' && frontmatter.value.docActions !== false)
const markdownPath = computed(() => {
  const path = route.path.replace(/\.html$/, '')
  if (path === '/') return '/index.md'
  if (path.endsWith('/')) return `${path}index.md`
  return `${path}.md`
})
const group = computed(() => docsGroups.find(({ items }) =>
  items.some(({ link }) => normalizePath(link) === normalizePath(route.path)),
))

async function copyMarkdown(): Promise<void> {
  try {
    const response = await fetch(markdownPath.value)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    await navigator.clipboard.writeText(await response.text())
    status.value = 'Markdown copied'
  } catch {
    status.value = 'Could not copy. Open the Markdown version instead.'
  }

  window.setTimeout(() => { status.value = '' }, 3000)
}

async function copyAgentPrompt(): Promise<void> {
  const source = `https://gacela-project.com${markdownPath.value}`
  const prompt = `Use the Gacela 2.0 documentation at ${source} as the source of truth. Follow its current PHP 8.3+ examples and preserve the module boundaries it describes.`

  try {
    await navigator.clipboard.writeText(prompt)
    status.value = 'Agent prompt copied'
  } catch {
    status.value = 'Could not copy the agent prompt.'
  }

  window.setTimeout(() => { status.value = '' }, 3000)
}

function normalizePath(path: string): string {
  return path.replace(/\.html$/, '').replace(/\/$/, '') || '/'
}
</script>

<template>
  <div v-if="visible" class="gz-doc-context">
    <nav v-if="group" class="gz-doc-breadcrumbs" aria-label="Breadcrumb">
      <a href="/docs/">Docs</a>
      <span aria-hidden="true">/</span>
      <span>{{ group.text }}</span>
    </nav>
    <div class="gz-doc-actions" aria-label="Documentation actions">
      <button type="button" class="gz-doc-action" @click="copyMarkdown">
        Copy Markdown
      </button>
      <button type="button" class="gz-doc-action" @click="copyAgentPrompt">
        Copy agent prompt
      </button>
      <a class="gz-doc-action" :href="markdownPath" target="_blank" rel="alternate">
        View Markdown
      </a>
      <span class="gz-doc-action-status" role="status" aria-live="polite">{{ status }}</span>
    </div>
  </div>
</template>
