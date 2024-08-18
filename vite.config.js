// vite.config.js
import {defineConfig} from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            external: [
                'public/full-gacela-logo.svg',
                'public/full-gacela-logo-dark.svg',
            ]
        }
    }
})