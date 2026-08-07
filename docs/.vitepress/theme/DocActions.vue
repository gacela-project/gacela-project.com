<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData, useRoute } from 'vitepress'

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
</script>

<template>
  <div v-if="visible" class="gz-doc-actions" aria-label="Documentation actions">
    <button type="button" class="gz-doc-action" @click="copyMarkdown">
      <span aria-hidden="true">▣</span>
      Copy Markdown
    </button>
    <a class="gz-doc-action" :href="markdownPath" target="_blank" rel="alternate">
      <span aria-hidden="true">↗</span>
      View Markdown
    </a>
    <span class="gz-doc-action-status" role="status" aria-live="polite">{{ status }}</span>
  </div>
</template>
