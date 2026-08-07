<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page } = useData()
const visible = computed(() => frontmatter.value.layout !== 'home' && frontmatter.value.docActions !== false)
const issueUrl = computed(() => {
  const title = encodeURIComponent(`Docs: ${page.value.title || page.value.relativePath}`)
  const body = encodeURIComponent(`Page: https://gacela-project.com/${page.value.relativePath.replace(/index\.md$/, '').replace(/\.md$/, '')}\n\nWhat was unclear or missing?\n`)
  return `https://github.com/gacela-project/gacela-project.com/issues/new?labels=documentation&title=${title}&body=${body}`
})
</script>

<template>
  <section v-if="visible" class="gz-doc-feedback" aria-labelledby="gz-doc-feedback-title">
    <div>
      <strong id="gz-doc-feedback-title">Still blocked?</strong>
      <span>Help improve this page or ask the community for a concrete answer.</span>
    </div>
    <div class="gz-doc-feedback-links">
      <a :href="issueUrl" target="_blank" rel="noopener">Report unclear docs</a>
      <a href="https://github.com/gacela-project/gacela/discussions" target="_blank" rel="noopener">Ask a question</a>
    </div>
  </section>
</template>
